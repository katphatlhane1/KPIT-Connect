import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FIBRE_COVERAGE_ZONES,
  FIBRE_PLANS,
  haversineKm,
  isWithinSouthAfrica,
} from './src/data/kpitData.ts';
import type { CoverageStatus, FibreCoverageZone } from './src/data/kpitData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// High-entropy 64KB chunk generated once at startup so download speed tests
// cannot be trivially compressed by HTTP intermediaries.
const RANDOM_CHUNK = crypto.randomBytes(65536);

interface InquiryRecord {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  planId: string;
  commitment: 'monthly' | '12month';
  upsBackup: boolean;
  coverageStatus: string;
  createdAt: string;
}

const INQUIRY_LOG: InquiryRecord[] = [];

function evaluateSouthAfricaCoverage(lat: number, lng: number, countryCode?: string) {
  if (countryCode && countryCode.toUpperCase() !== 'ZA') {
    return {
      inSouthAfrica: false,
      status: 'outside_sa' as CoverageStatus,
      infrastructure: 'Service unavailable outside South Africa',
      exchangeName: 'N/A',
      exchangeCode: 'OUT-OF-REGION',
      province: 'Outside South Africa',
      city: 'Outside South Africa',
      maxSpeedMbps: 0,
      symmetricalAvailable: false,
      installDays: 'Unavailable',
      distanceKm: 0,
      matchedZone: null as FibreCoverageZone | null,
      recommendedPlanIds: [] as string[],
    };
  }

  if (!isWithinSouthAfrica(lat, lng)) {
    return {
      inSouthAfrica: false,
      status: 'outside_sa' as CoverageStatus,
      infrastructure: 'Service unavailable outside South Africa',
      exchangeName: 'N/A',
      exchangeCode: 'OUT-OF-REGION',
      province: 'Outside South Africa',
      city: 'Outside South Africa',
      maxSpeedMbps: 0,
      symmetricalAvailable: false,
      installDays: 'Unavailable',
      distanceKm: 0,
      matchedZone: null as FibreCoverageZone | null,
      recommendedPlanIds: [] as string[],
    };
  }

  let nearestZone: FibreCoverageZone = FIBRE_COVERAGE_ZONES[0];
  let minDistance = Infinity;
  let containedZone: FibreCoverageZone | null = null;

  for (const zone of FIBRE_COVERAGE_ZONES) {
    const dist = haversineKm(lat, lng, zone.center.lat, zone.center.lng);
    if (dist <= zone.radiusKm) {
      if (!containedZone || (containedZone.status !== 'live' && zone.status === 'live') || dist < minDistance) {
        containedZone = zone;
      }
    }
    if (dist < minDistance) {
      minDistance = dist;
      nearestZone = zone;
    }
  }

  if (containedZone) {
    const distanceKm = Number(haversineKm(lat, lng, containedZone.center.lat, containedZone.center.lng).toFixed(2));
    const recommendedPlanIds = FIBRE_PLANS.filter((p) => p.downloadMbps <= containedZone.maxSpeedMbps).map((p) => p.id);
    return {
      inSouthAfrica: true,
      status: containedZone.status as CoverageStatus,
      infrastructure: containedZone.infrastructure,
      exchangeName: containedZone.name,
      exchangeCode: containedZone.exchangeCode,
      province: containedZone.province,
      city: containedZone.city,
      maxSpeedMbps: containedZone.maxSpeedMbps,
      symmetricalAvailable: containedZone.symmetricalAvailable,
      installDays: containedZone.installDays,
      distanceKm,
      matchedZone: containedZone,
      recommendedPlanIds,
    };
  }

  return {
    inSouthAfrica: true,
    status: 'wireless_failover' as CoverageStatus,
    infrastructure: 'KPIT Licensed Point-to-Point Wireless & 5G Enterprise',
    exchangeName: `Nearest POP: ${nearestZone.name}`,
    exchangeCode: nearestZone.exchangeCode,
    province: nearestZone.province,
    city: nearestZone.city,
    maxSpeedMbps: 200,
    symmetricalAvailable: false,
    installDays: '5–7 business days (Site Survey)',
    distanceKm: Number(minDistance.toFixed(2)),
    matchedZone: nearestZone,
    recommendedPlanIds: ['home-50', 'home-100', 'biz-100'],
  };
}

async function startServer() {
  const app = express();

  app.use('/api/speedtest/upload', express.raw({ limit: '16mb', type: '*/*' }));
  app.use(express.json({ limit: '256kb' }));

  // 1. Real-Time Speed Test: Ping / Latency endpoint
  app.get('/api/speedtest/ping', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ ok: true, ts: Date.now() });
  });

  // 2. Real-Time Speed Test: Multi-stream binary download endpoint (uncompressible)
  app.get('/api/speedtest/download', (req: Request, res: Response) => {
    const requestedBytes = Number(req.query.bytes) || 4 * 1024 * 1024;
    const totalBytes = Math.min(Math.max(requestedBytes, 65536), 16 * 1024 * 1024);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', String(totalBytes));
    res.setHeader('Content-Encoding', 'identity');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');

    let remaining = totalBytes;
    let aborted = false;

    req.on('close', () => {
      aborted = true;
    });

    function pushChunk() {
      while (remaining > 0 && !aborted) {
        const size = Math.min(remaining, RANDOM_CHUNK.length);
        const slice = size === RANDOM_CHUNK.length ? RANDOM_CHUNK : RANDOM_CHUNK.subarray(0, size);
        remaining -= size;
        const ok = res.write(slice);
        if (!ok) {
          res.once('drain', pushChunk);
          return;
        }
      }
      if (!aborted && !res.writableEnded) {
        res.end();
      }
    }

    pushChunk();
  });

  // 3. Real-Time Speed Test: Binary upload endpoint
  app.post('/api/speedtest/upload', (req: Request, res: Response) => {
    const receivedBytes = Buffer.isBuffer(req.body) ? req.body.length : 0;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      ok: true,
      receivedBytes,
      serverTs: Date.now(),
    });
  });

  // 4. South Africa KPIT Fibre Coverage Evaluation endpoint
  app.post('/api/coverage/check', async (req: Request, res: Response) => {
    try {
      const { lat, lng, address, countryCode } = req.body ?? {};

      if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
        const result = evaluateSouthAfricaCoverage(lat, lng, typeof countryCode === 'string' ? countryCode : undefined);
        res.json({
          address: typeof address === 'string' ? address.slice(0, 240) : `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          lat,
          lng,
          ...result,
        });
        return;
      }

      if (typeof address === 'string' && address.trim().length >= 3 && address.trim().length <= 240) {
        const cleanQuery = address.trim();
        const lower = cleanQuery.toLowerCase();

        const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          try {
            const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
            url.searchParams.set('address', cleanQuery);
            url.searchParams.set('components', 'country:ZA');
            url.searchParams.set('region', 'za');
            url.searchParams.set('key', apiKey);

            const geoRes = await fetch(url.toString());
            if (geoRes.ok) {
              const geoData = (await geoRes.json()) as {
                status?: string;
                results?: Array<{
                  formatted_address?: string;
                  geometry?: { location?: { lat?: number; lng?: number } };
                  address_components?: Array<{ short_name?: string; types?: string[] }>;
                }>;
              };
              const first = geoData.results?.[0];
              const gLat = first?.geometry?.location?.lat;
              const gLng = first?.geometry?.location?.lng;
              if (typeof gLat === 'number' && typeof gLng === 'number') {
                const countryComp = first?.address_components?.find((c) => c.types?.includes('country'));
                const result = evaluateSouthAfricaCoverage(gLat, gLng, countryComp?.short_name);
                res.json({
                  address: first?.formatted_address || cleanQuery,
                  lat: gLat,
                  lng: gLng,
                  ...result,
                });
                return;
              }
            }
          } catch {
            // Fall through to deterministic South African metro matching
          }
        }

        const matched = FIBRE_COVERAGE_ZONES.find(
          (z) =>
            lower.includes(z.city.toLowerCase()) ||
            lower.includes(z.province.toLowerCase()) ||
            z.name
              .toLowerCase()
              .split(/[,&]+/)
              .some((part) => part.trim().length > 3 && lower.includes(part.trim()))
        );

        if (matched) {
          const result = evaluateSouthAfricaCoverage(matched.center.lat, matched.center.lng, 'ZA');
          res.json({
            address: `${cleanQuery}, ${matched.city}, South Africa`,
            lat: matched.center.lat,
            lng: matched.center.lng,
            ...result,
          });
          return;
        }

        res.status(404).json({
          error: 'Could not pinpoint that South African street address. Please choose a suggestion from the address dropdown or click your location directly on the South Africa map.',
        });
        return;
      }

      res.status(400).json({ error: 'Please provide a valid South African street address or map coordinates.' });
    } catch {
      res.status(500).json({ error: 'Unable to evaluate coverage at this moment.' });
    }
  });

  // 5. Validated Fibre Installation / Business Wi-Fi Consultation Request
  app.post('/api/inquiries', (req: Request, res: Response) => {
    const body = req.body ?? {};
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
    const commitment = body.commitment === '12month' ? '12month' : 'monthly';
    const upsBackup = Boolean(body.upsBackup);
    const coverageStatus = typeof body.coverageStatus === 'string' ? body.coverageStatus.slice(0, 40) : 'pending';

    if (fullName.length < 2 || fullName.length > 100) {
      res.status(400).json({ error: 'Please enter your full name (2–100 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!/^(\+27|0)[0-9\s-]{8,14}$/.test(phone)) {
      res.status(400).json({ error: 'Please enter a valid South African phone number (e.g. 082 555 0142 or +27 82 555 0142).' });
      return;
    }
    if (address.length < 5 || address.length > 240) {
      res.status(400).json({ error: 'Please provide your South African installation street address.' });
      return;
    }

    const planExists = FIBRE_PLANS.some((p) => p.id === planId);
    if (!planExists) {
      res.status(400).json({ error: 'Please select a valid KPIT CONNECT fibre plan.' });
      return;
    }

    const reference = `KPIT-ZA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const record: InquiryRecord = {
      reference,
      fullName,
      email,
      phone,
      address,
      planId,
      commitment,
      upsBackup,
      coverageStatus,
      createdAt: new Date().toISOString(),
    };

    INQUIRY_LOG.unshift(record);
    if (INQUIRY_LOG.length > 200) {
      INQUIRY_LOG.pop();
    }

    res.status(201).json({
      ok: true,
      reference,
      message: `Application ${reference} logged for ${address}. Our Johannesburg provisioning desk will confirm line readiness within 2 business hours.`,
    });
  });

  if (IS_PROD) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KPIT CONNECT server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start KPIT CONNECT server:', err);
  process.exit(1);
});
