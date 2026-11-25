import { useEffect, useRef, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { TopNav } from './components/TopNav.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { CoverageSection } from './components/CoverageSection.tsx';
import type { CoverageResult } from './components/CoverageSection.tsx';
import { SpeedTestSection } from './components/SpeedTestSection.tsx';
import { PlanComparisonSection } from './components/PlanComparisonSection.tsx';
import { BusinessWifiSection } from './components/BusinessWifiSection.tsx';
import { OrderModal } from './components/OrderModal.tsx';
import { LocationPermissionModal } from './components/LocationPermissionModal.tsx';
import { Footer } from './components/Footer.tsx';
import { FIBRE_PLANS } from './data/kpitData.ts';
import type { FibrePlan } from './data/kpitData.ts';

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [highlightedPlanId, setHighlightedPlanId] = useState<string | null>(null);
  const [verifiedAddress, setVerifiedAddress] = useState<string>('');
  const [verifiedCoverage, setVerifiedCoverage] = useState<CoverageResult | null>(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderPlan, setOrderPlan] = useState<FibrePlan | null>(null);
  const [orderCommitment, setOrderCommitment] = useState<'monthly' | '12month'>('12month');

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [deviceLocationTrigger, setDeviceLocationTrigger] = useState<{
    lat: number;
    lng: number;
    seq: number;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  useEffect(() => {
    try {
      const handled = window.sessionStorage.getItem('kpit_location_prompt_handled');
      if (handled) return;
    } catch {
      // Ignore storage access restrictions
    }

    const timer = window.setTimeout(() => {
      setLocationModalOpen(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, []);

  const scrollToCoverageAndFocus = () => {
    const el = document.getElementById('coverage');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 350);
  };

  const scrollToSpeedTest = () => {
    document.getElementById('speedtest')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRecommendPlan = (planId: string) => {
    setHighlightedPlanId(planId);
    document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOrderForAddress = (address: string, coverage: CoverageResult) => {
    setVerifiedAddress(address);
    setVerifiedCoverage(coverage);
    const preferredPlan =
      FIBRE_PLANS.find((p) => p.id === coverage.recommendedPlanIds[1]) ??
      FIBRE_PLANS.find((p) => p.id === coverage.recommendedPlanIds[0]) ??
      FIBRE_PLANS[1];
    setOrderPlan(preferredPlan);
    setOrderCommitment('12month');
    setOrderModalOpen(true);
  };

  const handleSelectPlan = (plan: FibrePlan, commitment: 'monthly' | '12month') => {
    setOrderPlan(plan);
    setOrderCommitment(commitment);
    setOrderModalOpen(true);
  };

  const handleSelectBusinessPlan = (planId: string) => {
    const plan = FIBRE_PLANS.find((p) => p.id === planId) ?? FIBRE_PLANS.find((p) => p.category === 'business')!;
    setOrderPlan(plan);
    setOrderCommitment('12month');
    setOrderModalOpen(true);
  };

  const markLocationPromptHandled = (state: 'granted' | 'dismissed') => {
    try {
      window.sessionStorage.setItem('kpit_location_prompt_handled', state);
    } catch {
      // Ignore storage access restrictions
    }
  };

  const handleCloseLocationModal = () => {
    markLocationPromptHandled('dismissed');
    setLocationModalOpen(false);
  };

  const handleEnterAddressManually = () => {
    markLocationPromptHandled('dismissed');
    setLocationModalOpen(false);
    scrollToCoverageAndFocus();
  };

  const handleLocationResolved = (coords: { lat: number; lng: number }) => {
    markLocationPromptHandled('granted');
    setLocationModalOpen(false);
    setDeviceLocationTrigger({
      lat: coords.lat,
      lng: coords.lng,
      seq: Date.now(),
    });
    document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const content = (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <TopNav onCheckAddressClick={scrollToCoverageAndFocus} />

      <main className="flex-1">
        <HeroSection
          onCheckAddressClick={scrollToCoverageAndFocus}
          onRunSpeedTestClick={scrollToSpeedTest}
        />

        <CoverageSection
          hasMapsKey={Boolean(MAPS_API_KEY)}
          onOrderForAddress={handleOrderForAddress}
          searchInputRef={searchInputRef}
          externalLocationTrigger={deviceLocationTrigger}
          onOpenLocationPopup={() => setLocationModalOpen(true)}
        />

        <SpeedTestSection onRecommendPlan={handleRecommendPlan} />

        <PlanComparisonSection
          highlightedPlanId={highlightedPlanId}
          maxCoverageSpeedMbps={verifiedCoverage?.maxSpeedMbps ?? null}
          onSelectPlan={handleSelectPlan}
        />

        <BusinessWifiSection onSelectBusinessPlan={handleSelectBusinessPlan} />
      </main>

      <Footer />

      <OrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        initialPlan={orderPlan}
        initialCommitment={orderCommitment}
        initialAddress={verifiedAddress}
        coverageStatus={verifiedCoverage?.status ?? 'pending'}
      />

      <LocationPermissionModal
        isOpen={locationModalOpen}
        onClose={handleCloseLocationModal}
        onEnterManually={handleEnterAddressManually}
        onLocationResolved={handleLocationResolved}
      />
    </div>
  );

  if (!MAPS_API_KEY) {
    return content;
  }

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      libraries={['places', 'marker']}
      region="ZA"
      language="en"
    >
      {content}
    </APIProvider>
  );
}
