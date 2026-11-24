import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import { FIBRE_PLANS, MAX_SPEEDTEST_MBPS, SPEED_TEST_SERVERS } from '../data/kpitData.ts';

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'complete' | 'error';

interface TelemetrySample {
  t: number;
  mbps: number;
  phase: 'download' | 'upload';
}

interface SpeedTestRun {
  id: string;
  timestamp: string;
  serverLabel: string;
  pingMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
}

interface SpeedTestSectionProps {
  onRecommendPlan: (planId: string) => void;
}

const HISTORY_STORAGE_KEY = 'kpit_connect_speedtest_history_v2';

function clampMbps(rawMbps: number): number {
  if (!Number.isFinite(rawMbps) || rawMbps < 0) return 0;
  return Math.min(MAX_SPEEDTEST_MBPS, Number(rawMbps.toFixed(1)));
}

export function SpeedTestSection({ onRecommendPlan }: SpeedTestSectionProps) {
  const [selectedServerId, setSelectedServerId] = useState(SPEED_TEST_SERVERS[0].id);
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [liveMbps, setLiveMbps] = useState<number>(0);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [jitterMs, setJitterMs] = useState<number | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [samples, setSamples] = useState<TelemetrySample[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<SpeedTestRun[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SpeedTestRun[]) : [];
    } catch {
      return [];
    }
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 8)));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  const activeServer = useMemo(
    () => SPEED_TEST_SERVERS.find((s) => s.id === selectedServerId) ?? SPEED_TEST_SERVERS[0],
    [selectedServerId]
  );

  const stopTest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase('idle');
    setProgressPct(0);
    setLiveMbps(0);
  };

  const runRealSpeedTest = async () => {
    stopTest();
    const controller = new AbortController();
    abortRef.current = controller;

    setErrorMsg(null);
    setPingMs(null);
    setJitterMs(null);
    setDownloadMbps(null);
    setUploadMbps(null);
    setLiveMbps(0);
    setSamples([]);
    setProgressPct(4);

    try {
      // PHASE 1: Warmup + Latency & Jitter (10 real round-trip requests)
      setPhase('ping');
      await fetch(`/api/speedtest/ping?warmup=1&t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });

      const rtts: number[] = [];
      for (let i = 0; i < 10; i++) {
        if (controller.signal.aborted) return;
        const t0 = performance.now();
        const res = await fetch(`/api/speedtest/ping?seq=${i}&t=${Date.now()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Ping endpoint unavailable');
        await res.json();
        const rtt = performance.now() - t0;
        rtts.push(rtt);
        setProgressPct(4 + Math.round(((i + 1) / 10) * 16));
      }

      const avgPing = rtts.reduce((sum, v) => sum + v, 0) / rtts.length;
      let jitterSum = 0;
      for (let i = 1; i < rtts.length; i++) {
        jitterSum += Math.abs(rtts[i] - rtts[i - 1]);
      }
      const avgJitter = rtts.length > 1 ? jitterSum / (rtts.length - 1) : 0;

      const measuredPing = Number(avgPing.toFixed(1));
      const measuredJitter = Number(avgJitter.toFixed(1));
      setPingMs(measuredPing);
      setJitterMs(measuredJitter);

      // PHASE 2: Real Multi-Stream Download (256KB warmup + 3 concurrent streams, max 1000 Mbps)
      setPhase('download');
      const warmupRes = await fetch(`/api/speedtest/download?bytes=262144&warmup=1&r=${Math.random()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      await warmupRes.arrayBuffer();

      const dlStart = performance.now();
      const dlDurationTargetMs = 4500;
      let totalDownloadedBytes = 0;
      const dlSamples: TelemetrySample[] = [];
      let lastSampleTime = dlStart;
      let lastSampleBytes = 0;

      const downloadStreamCount = 3;
      const bytesPerRequest = 4 * 1024 * 1024; // 4 MB per stream

      const dlAbort = new AbortController();
      const onParentAbort = () => dlAbort.abort();
      controller.signal.addEventListener('abort', onParentAbort);

      const samplerTimer = window.setInterval(() => {
        const now = performance.now();
        const intervalSec = (now - lastSampleTime) / 1000;
        if (intervalSec > 0.05) {
          const deltaBytes = totalDownloadedBytes - lastSampleBytes;
          const instantMbps = clampMbps((deltaBytes * 8) / (intervalSec * 1_000_000));
          lastSampleBytes = totalDownloadedBytes;
          lastSampleTime = now;

          setLiveMbps(instantMbps);
          dlSamples.push({ t: now - dlStart, mbps: instantMbps, phase: 'download' });
          setSamples([...dlSamples]);

          const elapsed = now - dlStart;
          setProgressPct(20 + Math.min(40, Math.round((elapsed / dlDurationTargetMs) * 40)));
        }
        if (now - dlStart >= dlDurationTargetMs) {
          dlAbort.abort();
        }
      }, 150);

      const downloadWorker = async (workerIdx: number) => {
        while (!dlAbort.signal.aborted && !controller.signal.aborted) {
          try {
            const res = await fetch(
              `/api/speedtest/download?bytes=${bytesPerRequest}&w=${workerIdx}&r=${Math.random()}`,
              { cache: 'no-store', signal: dlAbort.signal }
            );
            if (!res.body) break;
            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                totalDownloadedBytes += value.byteLength;
              }
            }
          } catch {
            break;
          }
        }
      };

      await Promise.all(Array.from({ length: downloadStreamCount }, (_, idx) => downloadWorker(idx)));
      window.clearInterval(samplerTimer);
      controller.signal.removeEventListener('abort', onParentAbort);

      if (controller.signal.aborted) return;

      const dlElapsedSec = Math.max((performance.now() - dlStart) / 1000, 0.25);
      const measuredDownload = clampMbps((totalDownloadedBytes * 8) / (dlElapsedSec * 1_000_000));
      setDownloadMbps(measuredDownload);
      setLiveMbps(measuredDownload);
      setProgressPct(60);

      // PHASE 3: Real Server-Acknowledged Multi-Stream Upload (256KB warmup + 512KB chunks, max 1000 Mbps)
      setPhase('upload');
      const warmupUploadBuf = new Uint8Array(262144);
      await fetch(`/api/speedtest/upload?warmup=1&r=${Math.random()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: warmupUploadBuf,
        signal: controller.signal,
      });

      const ulStart = performance.now();
      const ulDurationTargetMs = 4200;
      const uploadChunkBytes = 512 * 1024; // 512 KB server-acknowledged chunk
      const uploadBuffer = new Uint8Array(uploadChunkBytes);
      for (let i = 0; i < uploadBuffer.length; i += 257) {
        uploadBuffer[i] = (i * 31) & 0xff;
      }

      let totalAckedUploadBytes = 0;
      let ulLastTime = ulStart;
      let ulLastBytes = 0;
      const ulSamples: TelemetrySample[] = [...dlSamples];

      const ulAbort = new AbortController();
      const onParentUploadAbort = () => ulAbort.abort();
      controller.signal.addEventListener('abort', onParentUploadAbort);

      const ulSampler = window.setInterval(() => {
        const now = performance.now();
        const dt = (now - ulLastTime) / 1000;
        if (dt > 0.05) {
          const delta = Math.max(0, totalAckedUploadBytes - ulLastBytes);
          const instantMbps = clampMbps((delta * 8) / (dt * 1_000_000));
          ulLastBytes = totalAckedUploadBytes;
          ulLastTime = now;

          setLiveMbps(instantMbps);
          ulSamples.push({
            t: dlDurationTargetMs + (now - ulStart),
            mbps: instantMbps,
            phase: 'upload',
          });
          setSamples([...ulSamples]);

          const elapsed = now - ulStart;
          setProgressPct(60 + Math.min(39, Math.round((elapsed / ulDurationTargetMs) * 39)));
        }

        if (now - ulStart >= ulDurationTargetMs) {
          ulAbort.abort();
        }
      }, 150);

      const uploadWorker = async (slot: number) => {
        while (!ulAbort.signal.aborted && !controller.signal.aborted) {
          try {
            const res = await fetch(`/api/speedtest/upload?s=${slot}&r=${Math.random()}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: uploadBuffer,
              signal: ulAbort.signal,
            });
            if (!res.ok) break;
            const payload = (await res.json()) as { receivedBytes?: number };
            totalAckedUploadBytes += payload.receivedBytes ?? uploadChunkBytes;
          } catch {
            break;
          }
        }
      };

      await Promise.all([uploadWorker(0), uploadWorker(1)]);
      window.clearInterval(ulSampler);
      controller.signal.removeEventListener('abort', onParentUploadAbort);

      if (controller.signal.aborted) return;

      const ulElapsedSec = Math.max((performance.now() - ulStart) / 1000, 0.25);
      const measuredUpload = clampMbps((totalAckedUploadBytes * 8) / (ulElapsedSec * 1_000_000));
      setUploadMbps(measuredUpload);
      setLiveMbps(measuredUpload);
      setProgressPct(100);
      setPhase('complete');

      const newRun: SpeedTestRun = {
        id: `${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
        serverLabel: activeServer.label,
        pingMs: measuredPing,
        jitterMs: measuredJitter,
        downloadMbps: measuredDownload,
        uploadMbps: measuredUpload,
      };
      setHistory((prev) => [newRun, ...prev].slice(0, 8));
    } catch (err) {
      if (controller.signal.aborted) return;
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Speed test interrupted.');
    }
  };

  // Fixed 0–1000 Mbps radial speedometer scale
  const gaugeMax = MAX_SPEEDTEST_MBPS;
  const clampedDisplayMbps = Math.min(MAX_SPEEDTEST_MBPS, liveMbps);
  const gaugeFraction = Math.min(1, clampedDisplayMbps / gaugeMax);
  const radius = 84;
  const circumference = Math.PI * radius;
  const strokeOffset = circumference * (1 - gaugeFraction);

  const recommendedPlan = useMemo(() => {
    if (downloadMbps === null) return FIBRE_PLANS.find((p) => p.id === 'home-100')!;
    if (downloadMbps < 45) return FIBRE_PLANS.find((p) => p.id === 'home-100')!;
    if (downloadMbps < 150) return FIBRE_PLANS.find((p) => p.id === 'home-200')!;
    if (downloadMbps < 350) return FIBRE_PLANS.find((p) => p.id === 'home-500')!;
    return FIBRE_PLANS.find((p) => p.id === 'home-1000')!;
  }, [downloadMbps]);

  const sparklinePath = useMemo(() => {
    if (samples.length < 2) return '';
    const maxVal = MAX_SPEEDTEST_MBPS;
    const width = 420;
    const height = 80;
    return samples
      .map((s, idx) => {
        const x = (idx / Math.max(1, samples.length - 1)) * width;
        const clamped = Math.min(MAX_SPEEDTEST_MBPS, s.mbps);
        const y = height - (clamped / maxVal) * (height - 8) - 4;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [samples]);

  const isRunning = phase === 'ping' || phase === 'download' || phase === 'upload';

  return (
    <section id="speedtest" className="py-16 lg:py-20 bg-slate-950 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-teal-400">
              Real-Time Line Diagnostics <span aria-hidden="true" className="mx-1.5 text-slate-600">·</span> 0–1,000 Mbps Scale
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
              Test your current internet speed in real time.
            </h2>
            <p className="mt-3 text-base text-slate-300 leading-relaxed">
              Measure your live round-trip latency, jitter, multi-stream download throughput, and server-verified upload capacity up to 1,000 Mbps against our Johannesburg core nodes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            <label htmlFor="speedtest-server" className="text-xs font-medium text-slate-400 whitespace-nowrap">
              Johannesburg Node:
            </label>
            <select
              id="speedtest-server"
              value={selectedServerId}
              disabled={isRunning}
              onChange={(e) => setSelectedServerId(e.target.value)}
              className="px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              {SPEED_TEST_SERVERS.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.label} ({server.facility})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Active Johannesburg Node</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {activeServer.label} <span aria-hidden="true" className="mx-1 text-slate-600">·</span> {activeServer.facility}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {!isRunning ? (
                  <button
                    type="button"
                    onClick={runRealSpeedTest}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {phase === 'complete' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{phase === 'complete' ? 'Run Test Again' : 'Start Speed Test'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopTest}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Square className="w-4 h-4" />
                    <span>Stop Test</span>
                  </button>
                )}
              </div>
            </div>

            {/* Radial Gauge (Fixed 0 - 1,000 Mbps) */}
            <div className="my-8 flex flex-col items-center">
              <div className="relative w-72 h-40 flex items-end justify-center">
                <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible" aria-hidden="true">
                  <path
                    d="M 16 100 A 84 84 0 0 1 184 100"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 16 100 A 84 84 0 0 1 184 100"
                    fill="none"
                    stroke={phase === 'upload' ? '#38bdf8' : '#14b8a6'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    style={{ transition: 'stroke-dashoffset 140ms ease-out' }}
                  />
                </svg>

                <div className="absolute bottom-2 text-center">
                  <p className="font-mono text-4xl sm:text-5xl font-semibold text-white tabular-nums tracking-tight">
                    {phase === 'idle' && downloadMbps === null
                      ? '0.0'
                      : phase === 'complete' && downloadMbps !== null
                      ? downloadMbps.toFixed(1)
                      : clampedDisplayMbps.toFixed(1)}
                  </p>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    {phase === 'ping' && 'Measuring Latency & Jitter...'}
                    {phase === 'download' && 'Mbps · Testing Multi-Stream Download'}
                    {phase === 'upload' && 'Mbps · Testing Server-Verified Upload'}
                    {phase === 'complete' && 'Mbps · Final Download Throughput'}
                    {phase === 'idle' && 'Mbps · Ready (Max Scale 1,000 Mbps)'}
                    {phase === 'error' && (errorMsg || 'Test interrupted')}
                  </p>
                </div>
              </div>

              {/* Scale Ticks 0 - 1000 */}
              <div className="w-72 flex items-center justify-between text-[11px] font-mono text-slate-500 tabular-nums mt-1 px-1">
                <span>0</span>
                <span>250</span>
                <span>500</span>
                <span>750</span>
                <span>1,000 Mbps</span>
              </div>

              <div className="w-full max-w-md mt-4">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400 transition-all duration-150"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Real-Time Throughput Curve (0–1,000 Mbps)</span>
                <span className="font-mono tabular-nums">
                  {samples.length > 0 ? `${samples.length} live samples` : 'Waiting for run'}
                </span>
              </div>
              <div className="h-20 w-full bg-slate-950/70 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                {sparklinePath ? (
                  <svg viewBox="0 0 420 80" preserveAspectRatio="none" className="w-full h-full">
                    <path d={sparklinePath} fill="none" stroke="#14b8a6" strokeWidth="2.2" />
                  </svg>
                ) : (
                  <span className="text-xs text-slate-500">
                    Click Start Speed Test to stream live throughput samples
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400">Download</p>
                <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                  {downloadMbps !== null ? downloadMbps.toFixed(1) : '—'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Mbps (Max 1,000)</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400">Upload</p>
                <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                  {uploadMbps !== null ? uploadMbps.toFixed(1) : '—'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Mbps (Max 1,000)</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400">Ping Latency</p>
                <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                  {pingMs !== null ? pingMs.toFixed(1) : '—'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">ms RTT</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-400">Jitter</p>
                <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                  {jitterMs !== null ? jitterMs.toFixed(1) : '—'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">ms variation</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
              <p className="text-xs font-medium text-teal-400">KPIT CONNECT Line Match</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-white">
                {phase === 'complete' && downloadMbps !== null
                  ? `Upgrade to ${recommendedPlan.name} (${recommendedPlan.downloadMbps} Mbps)`
                  : 'Benchmark your connection to match a fibre tier'}
              </h3>
              <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                {phase === 'complete' && downloadMbps !== null
                  ? downloadMbps < recommendedPlan.downloadMbps
                    ? `Your current line measured ${downloadMbps.toFixed(1)} Mbps. Moving to KPIT ${recommendedPlan.downloadMbps}/${recommendedPlan.uploadMbps} Mbps delivers ${(recommendedPlan.downloadMbps / Math.max(1, downloadMbps)).toFixed(1)}x faster downloads from R${recommendedPlan.twelveMonthPriceZar}/pm.`
                    : `Your line is performing strongly at ${downloadMbps.toFixed(1)} Mbps. Pair it with KPIT CONNECT unthrottled routing and 99.9% SLA protection.`
                  : 'Run a 10-second live test to see how your current connection compares against KPIT FTTH and Business SLA tiers.'}
              </p>
              <button
                type="button"
                onClick={() => onRecommendPlan(recommendedPlan.id)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                <span>Compare {recommendedPlan.name} in Plans</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-white">Recent Speed Runs</h3>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">
                  No completed runs recorded in this browser session yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-medium">Time</th>
                        <th className="pb-2 font-medium text-right">Down</th>
                        <th className="pb-2 font-medium text-right">Up</th>
                        <th className="pb-2 font-medium text-right">Ping</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums text-slate-200">
                      {history.slice(0, 4).map((run) => (
                        <tr key={run.id}>
                          <td className="py-2 font-sans text-slate-400">{run.timestamp}</td>
                          <td className="py-2 text-right">{run.downloadMbps.toFixed(1)} Mbps</td>
                          <td className="py-2 text-right">{run.uploadMbps.toFixed(1)} Mbps</td>
                          <td className="py-2 text-right">{run.pingMs.toFixed(0)} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
