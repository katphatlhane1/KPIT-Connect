import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface BusinessWifiSectionProps {
  onSelectBusinessPlan: (planId: string) => void;
}

export function BusinessWifiSection({ onSelectBusinessPlan }: BusinessWifiSectionProps) {
  const [hardwareImgFailed, setHardwareImgFailed] = useState(false);
  const [infraImgFailed, setInfraImgFailed] = useState(false);

  return (
    <section id="wifi" className="py-16 lg:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-blue-700">
            Enterprise Wireless &amp; Continuity <span aria-hidden="true" className="mx-1.5 text-slate-400">·</span> Built for South Africa
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance">
            Managed business Wi-Fi engineered for zero dead zones and load-shedding resilience.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            A fast fibre line only performs as well as the wireless fabric inside your premises. KPIT CONNECT deploys multi-node Wi-Fi 6 and Wi-Fi 7 hardware with automated power and LTE/5G failover.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Primary Wide Feature Card (col-span-7) */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="aspect-[16/10] w-full bg-slate-200 overflow-hidden">
              {!hardwareImgFailed ? (
                <img
                  src="/src/assets/images/wifi_mesh_hardware_1795500745494.jpg"
                  alt="KPIT CONNECT enterprise Wi-Fi 7 mesh access point and optical fibre ONT"
                  referrerPolicy="no-referrer"
                  onError={() => setHardwareImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-200 p-6">
                  <span className="font-display text-lg font-semibold">Wi-Fi 7 Enterprise Mesh &amp; Optical ONT</span>
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl font-semibold text-slate-950">
                  01. Managed Wi-Fi 7 Tri-Band Mesh &amp; Guest Portals
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Full heat-mapped coverage across multi-floor offices, retail showrooms, and estates. Separate corporate VLANs, POS traffic, and captive guest Wi-Fi with zero manual firmware maintenance.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-600 font-mono tabular-nums">
                  Up to 320 concurrent devices <span aria-hidden="true" className="mx-1.5">·</span> Seamless 802.11r roaming
                </div>
                <button
                  type="button"
                  onClick={() => onSelectBusinessPlan('biz-200')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Request Office Wi-Fi Survey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column Stacked Capabilities (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col">
              <div className="aspect-[16/9] w-full bg-slate-200 overflow-hidden">
                {!infraImgFailed ? (
                  <img
                    src="/src/assets/images/fibre_network_infra_1795500746915.jpg"
                    alt="KPIT CONNECT optical fibre distribution rack and Teraco core peering infrastructure"
                    referrerPolicy="no-referrer"
                    onError={() => setInfraImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-200 p-6">
                    <span className="font-display text-lg font-semibold">KPIT Optical Core &amp; Peering</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-semibold text-slate-950">
                  02. Direct NAPAfrica &amp; Metro Core Routing
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Local South African traffic peers directly via our Johannesburg core and national exchange hubs for low-latency VoIP, Microsoft 365, and AWS af-south-1 workloads.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 text-white border border-slate-800 rounded-xl p-6 space-y-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">
                  03. Dual-WAN 5G Failover &amp; DC UPS Power
                </h3>
                <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                  Keep your fibre ONT and Wi-Fi gateway powered for up to 8 hours during Stage 6 load-shedding, with sub-second failover to LTE/5G if physical fibre maintenance occurs.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="font-display text-lg font-semibold text-white">
                  04. Dedicated Johannesburg Business NOC
                </h3>
                <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                  Speak directly to our Johannesburg network engineers—never scripted call centres—with proactive line monitoring 24/7 across South Africa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
