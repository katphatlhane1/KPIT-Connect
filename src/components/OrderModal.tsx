import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { FIBRE_PLANS } from '../data/kpitData.ts';
import type { FibrePlan } from '../data/kpitData.ts';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan: FibrePlan | null;
  initialCommitment: 'monthly' | '12month';
  initialAddress: string;
  coverageStatus: string;
}

export function OrderModal({
  isOpen,
  onClose,
  initialPlan,
  initialCommitment,
  initialAddress,
  coverageStatus,
}: OrderModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(initialAddress);
  const [planId, setPlanId] = useState(initialPlan?.id ?? 'home-100');
  const [commitment, setCommitment] = useState<'monthly' | '12month'>(initialCommitment);
  const [upsBackup, setUpsBackup] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ reference: string; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAddress(initialAddress);
      if (initialPlan) setPlanId(initialPlan.id);
      setCommitment(initialCommitment);
      setError(null);
      setConfirmation(null);
    }
  }, [isOpen, initialAddress, initialPlan, initialCommitment]);

  if (!isOpen) return null;

  const selectedPlan = FIBRE_PLANS.find((p) => p.id === planId) ?? FIBRE_PLANS[1];
  const monthlyTotal =
    (commitment === '12month' ? selectedPlan.twelveMonthPriceZar : selectedPlan.monthlyPriceZar) +
    (upsBackup ? 49 : 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          address,
          planId,
          commitment,
          upsBackup,
          coverageStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Please check your contact details and try again.');
        return;
      }
      setConfirmation({
        reference: data.reference,
        message: data.message,
      });
    } catch {
      setError('Unable to submit order request right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-blue-700">KPIT CONNECT Provisioning Desk</p>
            <h2 id="order-modal-title" className="mt-1 font-display text-2xl font-bold text-slate-950">
              Schedule Fibre &amp; Wi-Fi Installation
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {confirmation ? (
          <div className="mt-6 p-5 rounded-xl bg-teal-50 border border-teal-200 space-y-3">
            <div className="flex items-center gap-2 text-teal-900 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-teal-700" />
              <span>Order Logged · {confirmation.reference}</span>
            </div>
            <p className="text-sm text-teal-900 leading-relaxed">{confirmation.message}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="order-plan" className="block text-xs font-semibold text-slate-700 mb-1">
                Selected Package
              </label>
              <select
                id="order-plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {FIBRE_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.downloadMbps}/{plan.uploadMbps} Mbps) — R
                    {commitment === '12month' ? plan.twelveMonthPriceZar : plan.monthlyPriceZar}/pm
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="order-address" className="block text-xs font-semibold text-slate-700 mb-1">
                South African Street Address
              </label>
              <input
                id="order-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street number, street name, suburb, city"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="order-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="order-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Thabo Mokoena"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label htmlFor="order-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  South African Phone
                </label>
                <input
                  id="order-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="082 555 0142"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="order-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="order-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.co.za"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={upsBackup}
                onChange={(e) => setUpsBackup(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong className="font-semibold text-slate-900">Add Mini-DC UPS Power Backup (+R49/pm)</strong>
                <br />
                Keeps your fibre ONT and Wi-Fi router running through 4–8 hours of load-shedding.
              </span>
            </label>

            {error && (
              <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Estimated Monthly</p>
                <p className="font-mono text-xl font-bold text-slate-950 tabular-nums">
                  R{monthlyTotal.toLocaleString('en-ZA')}/pm
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Confirm Availability & Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
