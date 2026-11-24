import { useState } from 'react';
import { ArrowRight, Gauge } from 'lucide-react';

interface HeroSectionProps {
  onCheckAddressClick: () => void;
  onRunSpeedTestClick: () => void;
}

export function HeroSection({ onCheckAddressClick, onRunSpeedTestClick }: HeroSectionProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <section id="top" className="bg-slate-950 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-16 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-300 tracking-wide">
              KP Informative Technologies Connect <span aria-hidden="true" className="mx-1.5 text-slate-500">·</span> Johannesburg Head Office <span aria-hidden="true" className="mx-1.5 text-slate-500">·</span> South Africa Coverage
            </p>

            <h1
              className="mt-4 font-display font-bold tracking-tight text-white text-balance"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', lineHeight: 1.06 }}
            >
              Unthrottled South African fibre &amp; business Wi-Fi.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Verify live KPIT CONNECT fibre availability at your street address across South Africa, benchmark your current connection in real time up to 1,000 Mbps, and deploy managed Wi-Fi built to stay online through load-shedding.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onCheckAddressClick}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                <span>Check Coverage</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onRunSpeedTestClick}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm sm:text-base font-medium text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                <Gauge className="w-4 h-4 text-teal-400" />
                <span>Test Current Speed</span>
              </button>
            </div>
          </div>

          {/* Right 16:9 Visual Anchor */}
          <div className="lg:col-span-6">
            <div className="relative w-full h-full min-h-[260px] lg:min-h-[380px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              {!heroImgFailed ? (
                <img
                  src="/src/assets/images/hero_fibre_workspace_1795500745785.jpg"
                  alt="KP Informative Technologies Connect modern Johannesburg commercial office powered by high-speed fibre and enterprise Wi-Fi"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-center">
                  <p className="font-display text-xl font-semibold text-white">KPIT CONNECT Fibre Core</p>
                  <p className="mt-2 text-sm text-slate-300">Johannesburg Head Office · South Africa Network</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
                <span className="font-medium">KPIT Optical Fibre &amp; Enterprise Wi-Fi Backbone</span>
                <span className="font-mono tabular-nums text-teal-300">Up to 1,000 Mbps · South Africa</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Proof Strip */}
        <div className="mt-10 pt-8 border-t border-slate-800/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="font-mono text-2xl font-semibold text-white tabular-nums">1,000 Mbps</p>
            <p className="mt-1 text-sm text-slate-400">Maximum KPIT FTTH &amp; FTTB throughput across live South African zones</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-white tabular-nums">99.9% SLA</p>
            <p className="mt-1 text-sm text-slate-400">Contractual business uptime monitored from our Johannesburg NOC</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-white tabular-nums">R0 Install</p>
            <p className="mt-1 text-sm text-slate-400">Free optical terminal &amp; Wi-Fi router activation on 12-month plans</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-white tabular-nums">3–5 Days</p>
            <p className="mt-1 text-sm text-slate-400">Typical provisioning turnaround in active South African zones</p>
          </div>
        </div>
      </div>
    </section>
  );
}
