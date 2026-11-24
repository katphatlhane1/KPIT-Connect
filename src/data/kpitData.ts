export type CoverageStatus = 'live' | 'build' | 'wireless_failover' | 'outside_sa';

export interface FibreCoverageZone {
  id: string;
  name: string;
  city: string;
  province: string;
  exchangeCode: string;
  status: 'live' | 'build';
  center: { lat: number; lng: number };
  radiusKm: number;
  maxSpeedMbps: number;
  symmetricalAvailable: boolean;
  installDays: string;
  infrastructure: string;
  polygon: Array<{ lat: number; lng: number }>;
}

export interface FibrePlan {
  id: string;
  name: string;
  category: 'home' | 'business';
  downloadMbps: number;
  uploadMbps: number;
  symmetrical: boolean;
  monthlyPriceZar: number;
  twelveMonthPriceZar: number;
  setupFeeMonthToMonthZar: number;
  routerIncluded: string;
  contentionRatio: string;
  fairUsagePolicy: string;
  slaUptime: string;
  supportWindow: string;
  failoverIncluded: string;
  recommendedFor: string;
  highlight?: boolean;
}

export interface SpeedTestServer {
  id: string;
  label: string;
  city: string;
  facility: string;
}

export interface QuickAddressPreset {
  label: string;
  address: string;
  suburb: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
}

export const SOUTH_AFRICA_BOUNDS = {
  north: -21.8,
  south: -35.2,
  west: 16.2,
  east: 33.2,
};

export const SOUTH_AFRICA_CENTER = {
  lat: -28.4793,
  lng: 24.6727,
};

export const MAX_SPEEDTEST_MBPS = 1000;

export const SPEED_TEST_SERVERS: SpeedTestServer[] = [
  {
    id: 'jnb-core',
    label: 'Johannesburg · JNB-01',
    city: 'Johannesburg',
    facility: 'Johannesburg Core Data Centre',
  },
  {
    id: 'jnb-sandton',
    label: 'Johannesburg · JNB-02',
    city: 'Johannesburg',
    facility: 'Sandton & Rosebank Metro POP',
  },
  {
    id: 'jnb-midrand',
    label: 'Johannesburg · JNB-03',
    city: 'Johannesburg',
    facility: 'Midrand Optical Transit Hub',
  },
];

function createHexPolygon(centerLat: number, centerLng: number, radiusKm: number): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  const latDegPerKm = 1 / 110.574;
  const lngDegPerKm = 1 / (111.32 * Math.cos((centerLat * Math.PI) / 180));
  for (let i = 0; i < 8; i++) {
    const angle = (i * 2 * Math.PI) / 8;
    const jitter = i % 2 === 0 ? 1.0 : 0.92;
    points.push({
      lat: Number((centerLat + Math.sin(angle) * radiusKm * jitter * latDegPerKm).toFixed(5)),
      lng: Number((centerLng + Math.cos(angle) * radiusKm * jitter * lngDegPerKm).toFixed(5)),
    });
  }
  return points;
}

export const FIBRE_COVERAGE_ZONES: FibreCoverageZone[] = [
  {
    id: 'za-gp-sandton',
    name: 'Sandton, Bryanston & Morningside',
    city: 'Johannesburg',
    province: 'Gauteng',
    exchangeCode: 'KPIT-GP-SND-01',
    status: 'live',
    center: { lat: -26.1076, lng: 28.0567 },
    radiusKm: 9.5,
    maxSpeedMbps: 1000,
    symmetricalAvailable: true,
    installDays: '3–5 business days',
    infrastructure: 'KPIT GPON / XGS-PON Fibre',
    polygon: createHexPolygon(-26.1076, 28.0567, 9.5),
  },
  {
    id: 'za-gp-rosebank-jhb',
    name: 'Rosebank, Parkhurst & Johannesburg CBD',
    city: 'Johannesburg',
    province: 'Gauteng',
    exchangeCode: 'KPIT-GP-RSB-02',
    status: 'live',
    center: { lat: -26.1565, lng: 28.0402 },
    radiusKm: 8.5,
    maxSpeedMbps: 1000,
    symmetricalAvailable: true,
    installDays: '3–5 business days',
    infrastructure: 'KPIT GPON / Metro Ethernet',
    polygon: createHexPolygon(-26.1565, 28.0402, 8.5),
  },
  {
    id: 'za-gp-midrand',
    name: 'Midrand, Waterfall City & Kyalami',
    city: 'Midrand',
    province: 'Gauteng',
    exchangeCode: 'KPIT-GP-MDR-04',
    status: 'live',
    center: { lat: -25.9992, lng: 28.1181 },
    radiusKm: 8.0,
    maxSpeedMbps: 1000,
    symmetricalAvailable: true,
    installDays: '4–6 business days',
    infrastructure: 'KPIT FTTH & FTTB Core',
    polygon: createHexPolygon(-25.9992, 28.1181, 8.0),
  },
  {
    id: 'za-gp-pretoria-east',
    name: 'Menlyn, Brooklyn & Pretoria East',
    city: 'Pretoria',
    province: 'Gauteng',
    exchangeCode: 'KPIT-GP-PTA-01',
    status: 'live',
    center: { lat: -25.7824, lng: 28.2753 },
    radiusKm: 10.5,
    maxSpeedMbps: 1000,
    symmetricalAvailable: true,
    installDays: '3–5 business days',
    infrastructure: 'KPIT GPON Fibre',
    polygon: createHexPolygon(-25.7824, 28.2753, 10.5),
  },
  {
    id: 'za-gp-centurion',
    name: 'Centurion & Irene',
    city: 'Centurion',
    province: 'Gauteng',
    exchangeCode: 'KPIT-GP-CTR-03',
    status: 'live',
    center: { lat: -25.8603, lng: 28.1894 },
    radiusKm: 8.0,
    maxSpeedMbps: 500,
    symmetricalAvailable: true,
    installDays: '4–6 business days',
    infrastructure: 'KPIT FTTH Fibre',
    polygon: createHexPolygon(-25.8603, 28.1894, 8.0),
  },
  {
    id: 'za-gp-soweto-north',
    name: 'Soweto North & Diepkloof Expansion',
    city: 'Johannesburg',
    province: 'Gauteng',
    exchangeCode: 'KPIT-GP-SWT-08',
    status: 'build',
    center: { lat: -26.2485, lng: 27.9125 },
    radiusKm: 7.5,
    maxSpeedMbps: 500,
    symmetricalAvailable: false,
    installDays: '14–21 business days (Pre-order)',
    infrastructure: 'KPIT Fibre Expansion Corridor',
    polygon: createHexPolygon(-26.2485, 27.9125, 7.5),
  },
  {
    id: 'za-wc-cpt-bowl',
    name: 'Atlantic Seaboard & CBD Network',
    city: 'Cape Town',
    province: 'Western Cape',
    exchangeCode: 'KPIT-WC-CPT-01',
    status: 'live',
    center: { lat: -33.9188, lng: 18.4112 },
    radiusKm: 7.5,
    maxSpeedMbps: 1000,
    symmetricalAvailable: true,
    installDays: '3–5 business days',
    infrastructure: 'KPIT GPON / XGS-PON Fibre',
    polygon: createHexPolygon(-33.9188, 18.4112, 7.5),
  },
  {
    id: 'za-wc-southern-suburbs',
    name: 'Claremont, Newlands & Constantia',
    city: 'Cape Town',
    province: 'Western Cape',
    exchangeCode: 'KPIT-WC-CLR-02',
    status: 'live',
    center: { lat: -33.9845, lng: 18.4648 },
    radiusKm: 8.5,
    maxSpeedMbps: 1000,
    symmetricalAvailable: true,
    installDays: '3–5 business days',
    infrastructure: 'KPIT GPON Fibre',
    polygon: createHexPolygon(-33.9845, 18.4648, 8.5),
  },
  {
    id: 'za-wc-century-city',
    name: 'Century City, Milnerton & Blouberg',
    city: 'Cape Town',
    province: 'Western Cape',
    exchangeCode: 'KPIT-WC-CNC-03',
    status: 'live',
    center: { lat: -33.8685, lng: 18.5082 },
    radiusKm: 9.0,
    maxSpeedMbps: 1000,
    symmetricalAvailable: true,
    installDays: '4–6 business days',
    infrastructure: 'KPIT FTTH & Business Metro',
    polygon: createHexPolygon(-33.8685, 18.5082, 9.0),
  },
  {
    id: 'za-wc-stellenbosch',
    name: 'Stellenbosch & Techno Park',
    city: 'Stellenbosch',
    province: 'Western Cape',
    exchangeCode: 'KPIT-WC-STB-01',
    status: 'live',
    center: { lat: -33.9321, lng: 18.8602 },
    radiusKm: 6.5,
    maxSpeedMbps: 500,
    symmetricalAvailable: true,
    installDays: '4–6 business days',
    infrastructure: 'KPIT GPON Fibre',
    polygon: createHexPolygon(-33.9321, 18.8602, 6.5),
  },
  {
    id: 'za-kzn-umhlanga',
    name: 'Umhlanga Ridge, La Lucia & Ballito South',
    city: 'Umhlanga',
    province: 'KwaZulu-Natal',
    exchangeCode: 'KPIT-KZN-UMH-01',
    status: 'live',
    center: { lat: -29.7253, lng: 31.0695 },
    radiusKm: 9.0,
    maxSpeedMbps: 1000,
    symmetricalAvailable: true,
    installDays: '3–5 business days',
    infrastructure: 'KPIT GPON / FTTB Fibre',
    polygon: createHexPolygon(-29.7253, 31.0695, 9.0),
  },
  {
    id: 'za-kzn-durban-berea',
    name: 'Berea, Morningside & Westville',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    exchangeCode: 'KPIT-KZN-DBN-02',
    status: 'live',
    center: { lat: -29.8392, lng: 30.9884 },
    radiusKm: 8.5,
    maxSpeedMbps: 500,
    symmetricalAvailable: true,
    installDays: '4–6 business days',
    infrastructure: 'KPIT FTTH Fibre',
    polygon: createHexPolygon(-29.8392, 30.9884, 8.5),
  },
  {
    id: 'za-ec-gqeberha',
    name: 'Summerstrand, Walmer & Gqeberha Central',
    city: 'Gqeberha',
    province: 'Eastern Cape',
    exchangeCode: 'KPIT-EC-PLZ-01',
    status: 'live',
    center: { lat: -33.9814, lng: 25.6197 },
    radiusKm: 8.5,
    maxSpeedMbps: 500,
    symmetricalAvailable: true,
    installDays: '5–7 business days',
    infrastructure: 'KPIT GPON Fibre',
    polygon: createHexPolygon(-33.9814, 25.6197, 8.5),
  },
  {
    id: 'za-fs-bloemfontein',
    name: 'Westdene, Universitas & Langenhoven Park',
    city: 'Bloemfontein',
    province: 'Free State',
    exchangeCode: 'KPIT-FS-BFN-01',
    status: 'live',
    center: { lat: -29.1072, lng: 26.1852 },
    radiusKm: 8.0,
    maxSpeedMbps: 500,
    symmetricalAvailable: false,
    installDays: '5–7 business days',
    infrastructure: 'KPIT GPON Fibre',
    polygon: createHexPolygon(-29.1072, 26.1852, 8.0),
  },
  {
    id: 'za-lp-polokwane',
    name: 'Bendor, Fauna Park & Polokwane Central',
    city: 'Polokwane',
    province: 'Limpopo',
    exchangeCode: 'KPIT-LP-PTG-01',
    status: 'build',
    center: { lat: -23.9045, lng: 29.4689 },
    radiusKm: 7.5,
    maxSpeedMbps: 500,
    symmetricalAvailable: false,
    installDays: '10–15 business days (Active Rollout)',
    infrastructure: 'KPIT Rollout & Metro Fibre',
    polygon: createHexPolygon(-23.9045, 29.4689, 7.5),
  },
  {
    id: 'za-mp-mbombela',
    name: 'West Acres & Mbombela Riverside',
    city: 'Mbombela',
    province: 'Mpumalanga',
    exchangeCode: 'KPIT-MP-NLP-01',
    status: 'live',
    center: { lat: -25.4753, lng: 30.9694 },
    radiusKm: 7.0,
    maxSpeedMbps: 300,
    symmetricalAvailable: false,
    installDays: '5–8 business days',
    infrastructure: 'KPIT GPON Fibre',
    polygon: createHexPolygon(-25.4753, 30.9694, 7.0),
  },
  {
    id: 'za-nw-potchefstroom',
    name: 'Bult, Baillie Park & Potchefstroom',
    city: 'Potchefstroom',
    province: 'North West',
    exchangeCode: 'KPIT-NW-PCF-01',
    status: 'build',
    center: { lat: -26.7145, lng: 27.097 },
    radiusKm: 6.5,
    maxSpeedMbps: 300,
    symmetricalAvailable: false,
    installDays: '14–21 business days (Pre-order)',
    infrastructure: 'KPIT Fibre Expansion',
    polygon: createHexPolygon(-26.7145, 27.097, 6.5),
  },
  {
    id: 'za-nc-kimberley',
    name: 'Royldene & Kimberley Central',
    city: 'Kimberley',
    province: 'Northern Cape',
    exchangeCode: 'KPIT-NC-KIM-01',
    status: 'build',
    center: { lat: -28.7282, lng: 24.7499 },
    radiusKm: 6.0,
    maxSpeedMbps: 200,
    symmetricalAvailable: false,
    installDays: '14–21 business days (Pre-order)',
    infrastructure: 'KPIT Metro Expansion',
    polygon: createHexPolygon(-28.7282, 24.7499, 6.0),
  },
];

export const QUICK_SA_ADDRESSES: QuickAddressPreset[] = [
  {
    label: 'Sandton City, JHB',
    address: '83 Rivonia Rd, Sandhurst, Sandton, 2196, South Africa',
    suburb: 'Sandton',
    city: 'Johannesburg',
    province: 'Gauteng',
    lat: -26.1076,
    lng: 28.0567,
  },
  {
    label: 'Rosebank, JHB',
    address: '177 Oxford Rd, Rosebank, Johannesburg, 2196, South Africa',
    suburb: 'Rosebank',
    city: 'Johannesburg',
    province: 'Gauteng',
    lat: -26.1467,
    lng: 28.0416,
  },
  {
    label: 'Waterfall City, Midrand',
    address: 'Lone Creek Cres, Waterfall City, Midrand, 1685, South Africa',
    suburb: 'Waterfall City',
    city: 'Midrand',
    province: 'Gauteng',
    lat: -26.0119,
    lng: 28.1056,
  },
  {
    label: 'Menlyn Maine, PTA',
    address: '180 Amarand Ave, Waterkloof Glen, Pretoria, 0181, South Africa',
    suburb: 'Menlyn',
    city: 'Pretoria',
    province: 'Gauteng',
    lat: -25.7867,
    lng: 28.2818,
  },
  {
    label: 'Sea Point, WC',
    address: '150 Main Rd, Sea Point, Cape Town, 8005, South Africa',
    suburb: 'Sea Point',
    city: 'Cape Town',
    province: 'Western Cape',
    lat: -33.9165,
    lng: 18.3877,
  },
];

export const FIBRE_PLANS: FibrePlan[] = [
  {
    id: 'home-50',
    name: 'Essential 50',
    category: 'home',
    downloadMbps: 50,
    uploadMbps: 50,
    symmetrical: true,
    monthlyPriceZar: 649,
    twelveMonthPriceZar: 599,
    setupFeeMonthToMonthZar: 950,
    routerIncluded: 'Dual-Band Wi-Fi 6 Router (Free on 12m)',
    contentionRatio: 'Unthrottled · Low Contention',
    fairUsagePolicy: 'True Uncapped · Zero FUP',
    slaUptime: '99.5% Network Availability',
    supportWindow: '7 Days · 07:00–22:00 SAST (JHB NOC)',
    failoverIncluded: 'Optional Mini-UPS R49/pm',
    recommendedFor: 'Apartments, remote work & HD streaming (1–3 users)',
  },
  {
    id: 'home-100',
    name: 'Stream 100',
    category: 'home',
    downloadMbps: 100,
    uploadMbps: 100,
    symmetrical: true,
    monthlyPriceZar: 849,
    twelveMonthPriceZar: 799,
    setupFeeMonthToMonthZar: 950,
    routerIncluded: 'AX3000 Wi-Fi 6 Mesh Router Included',
    contentionRatio: 'Unthrottled · Priority Routing',
    fairUsagePolicy: 'True Uncapped · Zero FUP',
    slaUptime: '99.5% Network Availability',
    supportWindow: '7 Days · 07:00–22:00 SAST (JHB NOC)',
    failoverIncluded: 'Optional Mini-UPS + 4G SIM',
    recommendedFor: 'Family homes, 4K streaming & cloud gaming (3–6 users)',
    highlight: true,
  },
  {
    id: 'home-200',
    name: 'Studio 200',
    category: 'home',
    downloadMbps: 200,
    uploadMbps: 100,
    symmetrical: false,
    monthlyPriceZar: 1099,
    twelveMonthPriceZar: 999,
    setupFeeMonthToMonthZar: 0,
    routerIncluded: 'AX5400 Wi-Fi 6 Pro Router Included',
    contentionRatio: 'Unthrottled · 1:1 Home Priority',
    fairUsagePolicy: 'True Uncapped · Zero FUP',
    slaUptime: '99.7% Network Availability',
    supportWindow: '24/7 WhatsApp & Phone (JHB NOC)',
    failoverIncluded: 'DC UPS Included on 12m',
    recommendedFor: 'Content creators, large households & smart homes',
  },
  {
    id: 'home-500',
    name: 'GigaCore 500',
    category: 'home',
    downloadMbps: 500,
    uploadMbps: 250,
    symmetrical: false,
    monthlyPriceZar: 1399,
    twelveMonthPriceZar: 1299,
    setupFeeMonthToMonthZar: 0,
    routerIncluded: 'BE6500 Wi-Fi 7 Tri-Band Mesh',
    contentionRatio: 'Unthrottled · Direct Peering',
    fairUsagePolicy: 'True Uncapped · Zero FUP',
    slaUptime: '99.8% Network Availability',
    supportWindow: '24/7 Priority NOC (Johannesburg)',
    failoverIncluded: 'DC UPS + 20GB LTE Backup',
    recommendedFor: 'Power users, heavy backups & multi-4K estates',
  },
  {
    id: 'home-1000',
    name: 'Hyperion 1000',
    category: 'home',
    downloadMbps: 1000,
    uploadMbps: 500,
    symmetrical: false,
    monthlyPriceZar: 1699,
    twelveMonthPriceZar: 1599,
    setupFeeMonthToMonthZar: 0,
    routerIncluded: 'Wi-Fi 7 Dual-Node Mesh System',
    contentionRatio: 'Unthrottled · Direct Core Peering',
    fairUsagePolicy: 'True Uncapped · Zero FUP',
    slaUptime: '99.9% Network Availability',
    supportWindow: '24/7 Dedicated Concierge (JHB)',
    failoverIncluded: 'DC UPS + 50GB LTE Backup',
    recommendedFor: 'Executive residences & multi-unit studios',
  },
  {
    id: 'biz-100',
    name: 'Commerce 100 SLA',
    category: 'business',
    downloadMbps: 100,
    uploadMbps: 100,
    symmetrical: true,
    monthlyPriceZar: 1499,
    twelveMonthPriceZar: 1349,
    setupFeeMonthToMonthZar: 1250,
    routerIncluded: 'Managed Wi-Fi 6 Business Gateway',
    contentionRatio: '1:1 Business Priority Queue',
    fairUsagePolicy: 'True Uncapped · Zero Throttling',
    slaUptime: '99.9% Contractual SLA',
    supportWindow: '24/7 Johannesburg NOC (4h MTTR)',
    failoverIncluded: '1x Static IPv4 + LTE Failover Ready',
    recommendedFor: 'Boutique offices, retail POS & VoIP teams (5–15 staff)',
  },
  {
    id: 'biz-200',
    name: 'Enterprise 200 Symmetrical',
    category: 'business',
    downloadMbps: 200,
    uploadMbps: 200,
    symmetrical: true,
    monthlyPriceZar: 2199,
    twelveMonthPriceZar: 1999,
    setupFeeMonthToMonthZar: 0,
    routerIncluded: '2x Wi-Fi 6E Ceiling APs + Router',
    contentionRatio: '1:1 Dedicated VLAN Priority',
    fairUsagePolicy: 'True Uncapped · Zero Throttling',
    slaUptime: '99.9% Contractual SLA',
    supportWindow: '24/7 Johannesburg NOC (4h MTTR)',
    failoverIncluded: '2x Static IPv4 + Auto 5G Failover',
    recommendedFor: 'Growing agencies, clinics & cloud-first SMEs (15–40 staff)',
    highlight: true,
  },
  {
    id: 'biz-500',
    name: 'Metro 500 Dedicated',
    category: 'business',
    downloadMbps: 500,
    uploadMbps: 500,
    symmetrical: true,
    monthlyPriceZar: 3499,
    twelveMonthPriceZar: 3199,
    setupFeeMonthToMonthZar: 0,
    routerIncluded: 'Managed Wi-Fi 7 Multi-AP Mesh',
    contentionRatio: '1:1 Uncontended Business',
    fairUsagePolicy: 'True Uncapped · Zero Throttling',
    slaUptime: '99.95% Contractual SLA',
    supportWindow: '24/7 Dedicated JHB Engineer (2h MTTR)',
    failoverIncluded: '/29 IPv4 Block + Dual-SIM 5G Failover',
    recommendedFor: 'Multi-floor offices, DevOps teams & call centres (40–100 staff)',
  },
  {
    id: 'biz-1000',
    name: 'Backbone 1000 Enterprise',
    category: 'business',
    downloadMbps: 1000,
    uploadMbps: 500,
    symmetrical: false,
    monthlyPriceZar: 4999,
    twelveMonthPriceZar: 4499,
    setupFeeMonthToMonthZar: 0,
    routerIncluded: 'Full Managed Wi-Fi 7 Campus Suite',
    contentionRatio: '1:1 BGP / Direct Peering',
    fairUsagePolicy: 'True Uncapped · Zero Throttling',
    slaUptime: '99.99% Dual-Path SLA',
    supportWindow: '24/7 Dedicated JHB Account Engineer',
    failoverIncluded: '/29 IPv4 + Uncapped 5G Failover + UPS',
    recommendedFor: 'Corporate HQs, campuses & co-working hubs (100+ staff)',
  },
];

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinSouthAfrica(lat: number, lng: number): boolean {
  return (
    lat <= SOUTH_AFRICA_BOUNDS.north &&
    lat >= SOUTH_AFRICA_BOUNDS.south &&
    lng >= SOUTH_AFRICA_BOUNDS.west &&
    lng <= SOUTH_AFRICA_BOUNDS.east
  );
}
