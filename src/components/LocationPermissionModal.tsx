import { useEffect, useState } from 'react';
import { LocateFixed, MapPin, ShieldCheck, X } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterManually: () => void;
  onLocationResolved: (coords: { lat: number; lng: number }) => void;
}

export function LocationPermissionModal({
  isOpen,
  onClose,
  onEnterManually,
  onLocationResolved,
}: LocationPermissionModalProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setLocating(false);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !locating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, locating, onClose]);

  if (!isOpen) return null;

  const handleRequestLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Location services are not supported by this browser. Please enter your South African street address manually.');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onLocationResolved({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (geoError) => {
        setLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            'Location access was declined. You can enable location permission in your browser settings or enter your street address manually.'
          );
        } else if (geoError.code === geoError.TIMEOUT) {
          setError(
            'Location detection timed out. Please try again or enter your South African address manually.'
          );
        } else {
          setError(
            'Unable to detect your current device location right now. Please enter your address manually.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 sm:p-7 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <LocateFixed className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-700">KPIT CONNECT Location Services</p>
              <h2 id="location-popup-title" className="font-display text-lg font-bold text-slate-950">
                Use your device location?
              </h2>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close location prompt"
            disabled={locating}
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Allow KP Informative Technologies Connect to access your device&apos;s location so we can automatically check South African fibre availability and pin your premises on the coverage map.
        </p>

        <ul className="mt-4 space-y-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
          <li className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>Instant fibre &amp; 5G coverage verification at your current coordinates</span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <span>Used only for coverage checking — never sold or stored without an order</span>
          </li>
        </ul>

        {error && (
          <p className="mt-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5 leading-relaxed">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleRequestLocation}
            disabled={locating}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <LocateFixed className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Detecting Location...' : 'Allow Device Location'}</span>
          </button>

          <button
            type="button"
            disabled={locating}
            onClick={onEnterManually}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Enter Manually
          </button>
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            disabled={locating}
            onClick={onClose}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
