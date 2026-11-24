import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  MapMouseEvent,
  Pin,
  Polygon,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Search,
  ShieldAlert,
  Wifi,
} from 'lucide-react';
import {
  FIBRE_COVERAGE_ZONES,
  QUICK_SA_ADDRESSES,
  SOUTH_AFRICA_BOUNDS,
  SOUTH_AFRICA_CENTER,
} from '../data/kpitData.ts';
import type { CoverageStatus, FibreCoverageZone, QuickAddressPreset } from '../data/kpitData.ts';
import { useAutocompleteSuggestions } from '../hooks/useAutocompleteSuggestions.ts';

export interface CoverageResult {
  address: string;
  lat: number;
  lng: number;
  inSouthAfrica: boolean;
  status: CoverageStatus;
  infrastructure: string;
  exchangeName: string;
  exchangeCode: string;
  province: string;
  city: string;
  maxSpeedMbps: number;
  symmetricalAvailable: boolean;
  installDays: string;
  distanceKm: number;
  matchedZone: FibreCoverageZone | null;
  recommendedPlanIds: string[];
}

interface CoverageSectionProps {
  hasMapsKey: boolean;
  onOrderForAddress: (address: string, coverage: CoverageResult) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const STATUS_META: Record<
  CoverageStatus,
  { label: string; summary: string; borderClass: string; badgeTextClass: string; pinBg: string; pinBorder: string }
> = {
  live: {
    label: 'KPIT Fibre Live',
    summary: 'Fibre infrastructure is active on your street and ready for installation.',
    borderClass: 'border-teal-600/30 bg-teal-50/60',
    badgeTextClass: 'text-teal-800',
    pinBg: '#0d9488',
    pinBorder: '#115e59',
  },
  build: {
    label: 'Network Expansion Corridor',
    summary: 'Fibre trenching is active in this precinct. Pre-order now for priority splicing.',
    borderClass: 'border-amber-600/30 bg-amber-50/70',
    badgeTextClass: 'text-amber-900',
    pinBg: '#d97706',
    pinBorder: '#92400e',
  },
  wireless_failover: {
    label: 'KPIT Wireless & 5G Zone',
    summary:
      'FTTH fibre is not yet live at this exact coordinate, but KPIT Licensed Wireless + 5G covers your premises.',
    borderClass: 'border-blue-600/30 bg-blue-50/70',
    badgeTextClass: 'text-blue-900',
    pinBg: '#2563eb',
    pinBorder: '#1e40af',
  },
  outside_sa: {
    label: 'Outside South Africa',
    summary:
      'KPIT CONNECT fibre and wireless services are available strictly within the Republic of South Africa.',
    borderClass: 'border-rose-600/30 bg-rose-50/70',
    badgeTextClass: 'text-rose-900',
    pinBg: '#e11d48',
    pinBorder: '#9f1239',
  },
};

function GoogleAddressInput({
  query,
  setQuery,
  searchInputRef,
  onSelectPlace,
  onSubmitDirect,
  checking,
}: {
  query: string;
  setQuery: (v: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectPlace: (payload: { lat: number; lng: number; address: string; countryCode?: string }) => Promise<void>;
  onSubmitDirect: (address: string) => Promise<void>;
  checking: boolean;
}) {
  const placesLib = useMapsLibrary('places');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    suggestions,
    isLoading: suggestionsLoading,
    error: autocompleteError,
    resetSession,
  } = useAutocompleteSuggestions(query, dropdownOpen);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      setDropdownOpen(false);
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });

        const formatted = place.formattedAddress || suggestion.placePrediction.text.text;
        setQuery(formatted);
        resetSession();

        const loc = place.location;
        if (!loc) {
          await onSubmitDirect(formatted);
          return;
        }

        const countryComponent = place.addressComponents?.find((comp) =>
          comp.types?.includes('country')
        );
        await onSelectPlace({
          lat: loc.lat(),
          lng: loc.lng(),
          address: formatted,
          countryCode: countryComponent?.shortText ?? undefined,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        await onSubmitDirect(query);
      }
    },
    [placesLib, resetSession, setQuery, onSelectPlace, onSubmitDirect, query]
  );

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDropdownOpen(false);
    if (suggestions.length > 0 && suggestions[0].placePrediction && placesLib) {
      await handleSelectSuggestion(suggestions[0]);
      return;
    }
    await onSubmitDirect(query);
  };

  return (
    <div ref={containerRef}>
      <form onSubmit={handleFormSubmit} className="space-y-3">
        <label htmlFor="sa-address-input" className="block text-sm font-semibold text-slate-900">
          South African Street Address
        </label>

        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="sa-address-input"
              type="text"
              value={query}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setDropdownOpen(true);
              }}
              placeholder="e.g. 83 Rivonia Rd, Sandton or 177 Oxford Rd, Rosebank"
              autoComplete="off"
              className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {dropdownOpen && (suggestions.length > 0 || suggestionsLoading) && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
              {suggestionsLoading && suggestions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-500">Searching South African addresses...</div>
              ) : (
                <ul
                  role="listbox"
                  aria-label="South African address suggestions"
                  className="divide-y divide-slate-100"
                >
                  {suggestions.map((suggestion, idx) => {
                    const text = suggestion.placePrediction?.text.text;
                    if (!text) return null;
                    return (
                      <li key={`${text}-${idx}`}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-800 hover:bg-blue-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{text}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {autocompleteError && <p className="text-xs text-slate-500">{autocompleteError}</p>}

        <button
          type="submit"
          disabled={checking}
          className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{checking ? 'Checking KPIT Fibre Footprint...' : 'Check Fibre Availability'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function InteractiveGoogleCoverageMap({
  coverage,
  showLiveLayer,
  showBuildLayer,
  showExchanges,
  infoOpen,
  setInfoOpen,
  onEvaluatePoint,
  focusTrigger,
}: {
  coverage: CoverageResult | null;
  showLiveLayer: boolean;
  showBuildLayer: boolean;
  showExchanges: boolean;
  infoOpen: boolean;
  setInfoOpen: (open: boolean) => void;
  onEvaluatePoint: (
    payload: { lat: number; lng: number; address: string; countryCode?: string },
    zoom?: number
  ) => Promise<void>;
  focusTrigger: { lat: number; lng: number; zoom: number; seq: number } | null;
}) {
  const map = useMap('kpit-sa-coverage-map');
  const apiStatus = useApiLoadingStatus();
  const [markerRef, markerInstance] = useAdvancedMarkerRef();

  useEffect(() => {
    if (!map || !focusTrigger) return;
    map.panTo({ lat: focusTrigger.lat, lng: focusTrigger.lng });
    map.setZoom(focusTrigger.zoom);
  }, [map, focusTrigger]);

  if (apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE) {
    return (
      <FallbackZoneDirectory
        onSelectZone={(zone) =>
          onEvaluatePoint(
            {
              lat: zone.center.lat,
              lng: zone.center.lng,
              address: `${zone.name}, ${zone.city}, ${zone.province}, South Africa`,
              countryCode: 'ZA',
            },
            13
          )
        }
      />
    );
  }

  const handleMapClick = async (ev: MapMouseEvent) => {
    const latLng = ev.detail.latLng;
    if (!latLng) return;
    await onEvaluatePoint(
      {
        lat: latLng.lat,
        lng: latLng.lng,
        address: `Pinned South Africa Coordinate (${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)})`,
      },
      13
    );
  };

  return (
    <GoogleMap
      id="kpit-sa-coverage-map"
      mapId="DEMO_MAP_ID"
      defaultCenter={SOUTH_AFRICA_CENTER}
      defaultZoom={5}
      minZoom={4}
      maxZoom={18}
      gestureHandling="greedy"
      restriction={{
        latLngBounds: SOUTH_AFRICA_BOUNDS,
        strictBounds: false,
      }}
      onClick={handleMapClick}
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      style={{ width: '100%', height: '100%' }}
    >
      {FIBRE_COVERAGE_ZONES.map((zone) => {
        if (zone.status === 'live' && !showLiveLayer) return null;
        if (zone.status === 'build' && !showBuildLayer) return null;

        const isLive = zone.status === 'live';
        return (
          <Polygon
            key={zone.id}
            paths={zone.polygon}
            fillColor={isLive ? '#0d9488' : '#d97706'}
            fillOpacity={isLive ? 0.22 : 0.2}
            strokeColor={isLive ? '#0f766e' : '#b45309'}
            strokeOpacity={0.85}
            strokeWeight={1.5}
            onClick={() =>
              onEvaluatePoint(
                {
                  lat: zone.center.lat,
                  lng: zone.center.lng,
                  address: `${zone.name}, ${zone.city}, ${zone.province}, South Africa`,
                  countryCode: 'ZA',
                },
                12
              )
            }
          />
        );
      })}

      {showExchanges &&
        FIBRE_COVERAGE_ZONES.map((zone) => (
          <AdvancedMarker
            key={`pop-${zone.id}`}
            position={zone.center}
            title={`${zone.exchangeCode} · ${zone.name}`}
            onClick={() =>
              onEvaluatePoint(
                {
                  lat: zone.center.lat,
                  lng: zone.center.lng,
                  address: `${zone.name}, ${zone.city}, ${zone.province}, South Africa`,
                  countryCode: 'ZA',
                },
                13
              )
            }
          >
            <Pin
              background={zone.status === 'live' ? '#0f766e' : '#b45309'}
              borderColor="#ffffff"
              glyphColor="#ffffff"
              scale={0.75}
            />
          </AdvancedMarker>
        ))}

      {coverage && coverage.inSouthAfrica && (
        <>
          <AdvancedMarker
            ref={markerRef}
            position={{ lat: coverage.lat, lng: coverage.lng }}
            title={coverage.address}
            onClick={() => setInfoOpen(true)}
          >
            <Pin
              background={STATUS_META[coverage.status].pinBg}
              borderColor={STATUS_META[coverage.status].pinBorder}
              glyphColor="#ffffff"
              scale={1.2}
            />
          </AdvancedMarker>

          {infoOpen && markerInstance && (
            <InfoWindow
              anchor={markerInstance}
              maxWidth={280}
              onCloseClick={() => setInfoOpen(false)}
            >
              <div className="p-1 text-slate-900 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {STATUS_META[coverage.status].label}
                </p>
                <p className="text-sm font-semibold leading-snug">{coverage.address}</p>
                <p className="text-xs text-slate-600">
                  {coverage.infrastructure} · Up to {coverage.maxSpeedMbps} Mbps
                </p>
                <p className="text-xs font-mono text-slate-500">{coverage.exchangeCode}</p>
              </div>
            </InfoWindow>
          )}
        </>
      )}
    </GoogleMap>
  );
}

function FallbackZoneDirectory({ onSelectZone }: { onSelectZone: (zone: FibreCoverageZone) => void }) {
  return (
    <div className="w-full h-full bg-slate-900 text-white p-6 overflow-y-auto flex flex-col justify-between">
      <div>
        <p className="text-xs font-mono text-teal-400">KPIT CONNECT South Africa Coverage Directory</p>
        <h3 className="mt-1 font-display text-xl font-semibold">
          Interactive Provincial Fibre Footprint
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          Select any South African exchange node below or enter a physical address on the left to check KPIT fibre readiness.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIBRE_COVERAGE_ZONES.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelectZone(zone)}
              className="text-left p-3 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-teal-400 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white truncate">{zone.city}</span>
                <span className="text-xs font-mono text-teal-300 shrink-0">
                  {zone.status === 'live' ? `${zone.maxSpeedMbps} Mbps Live` : 'Rollout'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 truncate">{zone.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CoverageSection({
  hasMapsKey,
  onOrderForAddress,
  searchInputRef,
}: CoverageSectionProps) {
  const [query, setQuery] = useState('');
  const [showLiveLayer, setShowLiveLayer] = useState(true);
  const [showBuildLayer, setShowBuildLayer] = useState(true);
  const [showExchanges, setShowExchanges] = useState(true);

  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<CoverageResult | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState<{
    lat: number;
    lng: number;
    zoom: number;
    seq: number;
  } | null>(null);

  const evaluateCoordinates = useCallback(
    async (
      payload: { lat?: number; lng?: number; address?: string; countryCode?: string },
      targetZoom = 13
    ) => {
      setChecking(true);
      setCheckError(null);
      try {
        const res = await fetch('/api/coverage/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setCheckError(data.error || 'Could not verify that South African address.');
          return;
        }
        const typedResult = data as CoverageResult;
        setCoverage(typedResult);
        setInfoOpen(true);
        if (typedResult.inSouthAfrica) {
          setFocusTrigger({
            lat: typedResult.lat,
            lng: typedResult.lng,
            zoom: targetZoom,
            seq: Date.now(),
          });
        }
      } catch {
        setCheckError('Network error while checking KPIT fibre coverage. Please try again.');
      } finally {
        setChecking(false);
      }
    },
    []
  );

  const handleDirectAddressSubmit = async (addressText: string) => {
    const trimmed = addressText.trim();
    if (trimmed.length < 3) {
      setCheckError('Please enter a South African street address, suburb, or city.');
      return;
    }
    await evaluateCoordinates({ address: trimmed }, 13);
  };

  const handleQuickPreset = async (preset: QuickAddressPreset) => {
    setQuery(preset.address);
    await evaluateCoordinates(
      {
        lat: preset.lat,
        lng: preset.lng,
        address: preset.address,
        countryCode: 'ZA',
      },
      13
    );
  };

  const handleResetSouthAfricaView = () => {
    setFocusTrigger({
      lat: SOUTH_AFRICA_CENTER.lat,
      lng: SOUTH_AFRICA_CENTER.lng,
      zoom: 5,
      seq: Date.now(),
    });
  };

  const activeMeta = coverage ? STATUS_META[coverage.status] : null;

  return (
    <section id="coverage" className="py-16 lg:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-700">
              KPIT Fibre Coverage Map <span aria-hidden="true" className="mx-1.5 text-slate-400">·</span> Republic of South Africa Only
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance">
              Check KPIT CONNECT fibre availability at your physical address.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Enter your South African street address or click directly on the coverage map to verify live KPIT GPON/XGS-PON fibre readiness, maximum supported line speeds up to 1,000 Mbps, and nearest network POP.
            </p>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 font-medium shrink-0">
            Provisioned by our Johannesburg Engineering Desk
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6">
              {hasMapsKey ? (
                <GoogleAddressInput
                  query={query}
                  setQuery={setQuery}
                  searchInputRef={searchInputRef}
                  onSelectPlace={(payload) => evaluateCoordinates(payload, 14)}
                  onSubmitDirect={handleDirectAddressSubmit}
                  checking={checking}
                />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleDirectAddressSubmit(query);
                  }}
                  className="space-y-3"
                >
                  <label htmlFor="sa-address-input" className="block text-sm font-semibold text-slate-900">
                    South African Street Address
                  </label>
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      id="sa-address-input"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. Sandton, Rosebank, Midrand, Pretoria"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={checking}
                    className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{checking ? 'Checking KPIT Fibre Footprint...' : 'Check Fibre Availability'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="mt-5 pt-4 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-2.5">
                  Try a South African address:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SA_ADDRESSES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleQuickPreset(preset)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {checkError && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-900 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p>{checkError}</p>
              </div>
            )}

            {coverage && activeMeta ? (
              <div className={`rounded-xl border p-5 sm:p-6 space-y-4 ${activeMeta.borderClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`flex items-center gap-2 text-sm font-semibold ${activeMeta.badgeTextClass}`}>
                      {coverage.status === 'live' ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                      ) : coverage.status === 'build' ? (
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                      ) : coverage.status === 'wireless_failover' ? (
                        <Wifi className="w-4 h-4 text-blue-700 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                      )}
                      <span>{activeMeta.label}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-900">{coverage.address}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{activeMeta.summary}</p>

                {coverage.inSouthAfrica && (
                  <>
                    <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900/10 text-sm">
                      <div>
                        <dt className="text-xs text-slate-500">Infrastructure</dt>
                        <dd className="font-medium text-slate-900 mt-0.5">{coverage.infrastructure}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Max Line Speed</dt>
                        <dd className="font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                          {coverage.maxSpeedMbps} Mbps {coverage.symmetricalAvailable ? '(Symmetrical)' : ''}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">KPIT Network Node</dt>
                        <dd className="font-mono text-xs text-slate-800 mt-0.5">{coverage.exchangeCode}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Install Turnaround</dt>
                        <dd className="font-medium text-slate-900 mt-0.5">{coverage.installDays}</dd>
                      </div>
                    </dl>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onOrderForAddress(coverage.address, coverage)}
                        className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Order Fibre for This Address
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6 text-sm text-slate-600 space-y-2">
                <p className="font-semibold text-slate-900">How coverage verification works</p>
                <p className="leading-relaxed">
                  Type any South African physical street address above or click a shaded coverage zone on the map to inspect line readiness, symmetrical speed eligibility, and installation turnaround.
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  All 9 provinces supported <span aria-hidden="true" className="mx-1">·</span> GP, WC, KZN, EC, FS, LP, MP, NW, NC
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 mr-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Map Layers:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowLiveLayer((v) => !v)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    showLiveLayer
                      ? 'bg-teal-50 border-teal-600/40 text-teal-900'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  Live KPIT Fibre
                </button>
                <button
                  type="button"
                  onClick={() => setShowBuildLayer((v) => !v)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    showBuildLayer
                      ? 'bg-amber-50 border-amber-600/40 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  Expansion Corridors
                </button>
                <button
                  type="button"
                  onClick={() => setShowExchanges((v) => !v)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    showExchanges
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  Network POPs
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetSouthAfricaView}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                Reset to South Africa View
              </button>
            </div>

            <div className="relative w-full h-[460px] lg:h-[560px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {hasMapsKey ? (
                <InteractiveGoogleCoverageMap
                  coverage={coverage}
                  showLiveLayer={showLiveLayer}
                  showBuildLayer={showBuildLayer}
                  showExchanges={showExchanges}
                  infoOpen={infoOpen}
                  setInfoOpen={setInfoOpen}
                  onEvaluatePoint={(payload, zoom) => evaluateCoordinates(payload, zoom)}
                  focusTrigger={focusTrigger}
                />
              ) : (
                <FallbackZoneDirectory
                  onSelectZone={(zone) =>
                    evaluateCoordinates(
                      {
                        lat: zone.center.lat,
                        lng: zone.center.lng,
                        address: `${zone.name}, ${zone.city}, ${zone.province}, South Africa`,
                        countryCode: 'ZA',
                      },
                      13
                    )
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
