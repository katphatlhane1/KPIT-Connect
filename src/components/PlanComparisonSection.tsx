import { useMemo, useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { FIBRE_PLANS } from '../data/kpitData.ts';
import type { FibrePlan } from '../data/kpitData.ts';

interface PlanComparisonSectionProps {
  highlightedPlanId: string | null;
  maxCoverageSpeedMbps: number | null;
  onSelectPlan: (plan: FibrePlan, commitment: 'monthly' | '12month') => void;
}

export function PlanComparisonSection({
  highlightedPlanId,
  maxCoverageSpeedMbps,
  onSelectPlan,
}: PlanComparisonSectionProps) {
  const [category, setCategory] = useState<'home' | 'business'>('home');
  const [commitment, setCommitment] = useState<'12month' | 'monthly'>('12month');
  const [compareIds, setCompareIds] = useState<string[]>(['home-50', 'home-100', 'home-200']);

  // Interactive Bandwidth Needs Estimator
  const [concurrentUsers, setConcurrentUsers] = useState<number>(4);
  const [streams4k, setStreams4k] = useState<number>(2);
  const [videoCalls, setVideoCalls] = useState<number>(2);

  const estimatedNeededMbps = useMemo(() => {
    const base = concurrentUsers * 12 + streams4k * 25 + videoCalls * 10;
    return Math.max(25, base);
  }, [concurrentUsers, streams4k, videoCalls]);

  const categoryPlans = useMemo(
    () => FIBRE_PLANS.filter((p) => p.category === category),
    [category]
  );

  const recommendedFromEstimator = useMemo(() => {
    const sorted = [...categoryPlans].sort((a, b) => a.downloadMbps - b.downloadMbps);
    return sorted.find((p) => p.downloadMbps >= estimatedNeededMbps) ?? sorted[sorted.length - 1];
  }, [categoryPlans, estimatedNeededMbps]);

  const handleCategorySwitch = (next: 'home' | 'business') => {
    setCategory(next);
    const defaults = FIBRE_PLANS.filter((p) => p.category === next)
      .slice(0, 3)
      .map((p) => p.id);
    setCompareIds(defaults);
  };

  const toggleCompare = (planId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(planId)) {
        return prev.length > 2 ? prev.filter((id) => id !== planId) : prev;
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), planId];
      }
      return [...prev, planId];
    });
  };

  const comparedPlans = useMemo(() => {
    const matched = categoryPlans.filter((p) => compareIds.includes(p.id));
    if (matched.length >= 2) return matched;
    return categoryPlans.slice(0, 3);
  }, [categoryPlans, compareIds]);

  const formatZar = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;

  return (
    <section id="plans" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-700">
              KPIT Fibre Backbone <span aria-hidden="true" className="mx-1.5 text-slate-400">·</span> Uncapped &amp; Unthrottled
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance">
              Compare fibre &amp; business Wi-Fi plans in South African Rand.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Every KPIT CONNECT package runs over high-capacity optical fibre with zero fair-usage throttling. Select up to three plans to compare specifications side by side.
            </p>
          </div>

          {/* Segmented Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-lg">
              <button
                type="button"
                onClick={() => handleCategorySwitch('home')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === 'home'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Home Fibre (FTTH)
              </button>
              <button
                type="button"
                onClick={() => handleCategorySwitch('business')}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === 'business'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Business Fibre &amp; Wi-Fi
              </button>
            </div>

            <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-lg">
              <button
                type="button"
                onClick={() => setCommitment('12month')}
                className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  commitment === '12month'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                12-Month (Free Install)
              </button>
              <button
                type="button"
                onClick={() => setCommitment('monthly')}
                className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  commitment === 'monthly'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Month-to-Month
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Bandwidth Estimator Bar */}
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-3 max-w-sm">
              <SlidersHorizontal className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Bandwidth Needs Estimator</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust active users, streams, and calls to calculate your ideal KPIT Fibre tier.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="est-users" className="font-medium text-slate-700">
                    Active Devices / Staff
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">{concurrentUsers}</span>
                </div>
                <input
                  id="est-users"
                  type="range"
                  min={1}
                  max={40}
                  value={concurrentUsers}
                  onChange={(e) => setConcurrentUsers(Number(e.target.value))}
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="est-4k" className="font-medium text-slate-700">
                    4K Streams / Cloud Sync
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">{streams4k}</span>
                </div>
                <input
                  id="est-4k"
                  type="range"
                  min={0}
                  max={10}
                  value={streams4k}
                  onChange={(e) => setStreams4k(Number(e.target.value))}
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="est-calls" className="font-medium text-slate-700">
                    Concurrent Video Calls
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">{videoCalls}</span>
                </div>
                <input
                  id="est-calls"
                  type="range"
                  min={0}
                  max={15}
                  value={videoCalls}
                  onChange={(e) => setVideoCalls(Number(e.target.value))}
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="lg:border-l lg:border-slate-200 lg:pl-6 shrink-0">
              <p className="text-xs text-slate-500">Recommended Throughput</p>
              <p className="font-mono text-lg font-semibold text-blue-700 tabular-nums">
                {estimatedNeededMbps} Mbps → {recommendedFromEstimator.name}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categoryPlans.map((plan) => {
            const price = commitment === '12month' ? plan.twelveMonthPriceZar : plan.monthlyPriceZar;
            const isHighlighted =
              highlightedPlanId === plan.id || recommendedFromEstimator.id === plan.id;
            const isCompared = compareIds.includes(plan.id);
            const exceedsAddressSpeed =
              maxCoverageSpeedMbps !== null &&
              maxCoverageSpeedMbps > 0 &&
              plan.downloadMbps > maxCoverageSpeedMbps;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border p-6 flex flex-col justify-between transition-colors ${
                  isHighlighted
                    ? 'border-blue-600 ring-1 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {isHighlighted ? 'Recommended Match' : plan.category === 'home' ? 'KPIT FTTH' : 'KPIT Business SLA'}
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    {plan.symmetrical ? 'Symmetrical' : '2:1 Ratio'}
                  </p>

                  <h3 className="mt-1.5 font-display text-xl font-bold text-slate-950">
                    {plan.name}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-bold text-slate-950 tabular-nums">
                      {formatZar(price)}
                    </span>
                    <span className="text-sm text-slate-500">/pm</span>
                  </div>

                  <p className="mt-1 text-xs font-mono text-slate-600 tabular-nums">
                    {plan.downloadMbps} Mbps Down / {plan.uploadMbps} Mbps Up
                  </p>

                  {exceedsAddressSpeed && (
                    <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                      Exceeds {maxCoverageSpeedMbps} Mbps max at pinned address
                    </p>
                  )}

                  <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                    {plan.recommendedFor}
                  </p>

                  <ul className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{plan.routerIncluded}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{plan.fairUsagePolicy}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{plan.slaUptime}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        {commitment === '12month'
                          ? 'R0 Fibre Install & Activation'
                          : plan.setupFeeMonthToMonthZar === 0
                          ? 'R0 Install & Activation'
                          : `R${plan.setupFeeMonthToMonthZar} Once-Off Activation`}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan, commitment)}
                    className={`w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isHighlighted
                        ? 'bg-blue-700 hover:bg-blue-800 text-white'
                        : 'bg-slate-950 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Select {plan.name}
                  </button>

                  <label className="flex items-center justify-center gap-2 text-xs text-slate-600 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={isCompared}
                      onChange={() => toggleCompare(plan.id)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span>Compare in table</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Side-by-Side Technical Comparison Table */}
        <div className="mt-12 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-slate-950">
              Side-by-Side Specification Comparison
            </h3>
            <span className="text-xs text-slate-500">
              Showing {comparedPlans.length} selected {category === 'home' ? 'Home' : 'Business'} plans
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="py-3.5 px-6 font-semibold text-slate-700 w-56">Specification</th>
                  {comparedPlans.map((plan) => (
                    <th key={plan.id} className="py-3.5 px-6 font-display font-bold text-slate-950">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">Monthly Price</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 font-mono font-semibold text-slate-950 tabular-nums">
                      {formatZar(commitment === '12month' ? p.twelveMonthPriceZar : p.monthlyPriceZar)}/pm
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">Download Speed</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 font-mono text-slate-900 tabular-nums">
                      {p.downloadMbps} Mbps
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">Upload Speed</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 font-mono text-slate-900 tabular-nums">
                      {p.uploadMbps} Mbps
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">Contention &amp; Shaping</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 text-slate-800">{p.contentionRatio}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">Fair Usage Policy</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 text-slate-800">{p.fairUsagePolicy}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">Included Hardware</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 text-slate-800">{p.routerIncluded}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">Load-Shedding &amp; Failover</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 text-slate-800">{p.failoverIncluded}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">Availability SLA</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 font-mono text-xs text-slate-800 tabular-nums">{p.slaUptime}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-6 text-slate-600 font-medium">NOC Support</td>
                  {comparedPlans.map((p) => (
                    <td key={p.id} className="py-3 px-6 text-slate-800">{p.supportWindow}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
