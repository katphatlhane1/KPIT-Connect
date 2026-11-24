import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface TopNavProps {
  onCheckAddressClick: () => void;
}

export function TopNav({ onCheckAddressClick }: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const navItems = [
    { label: 'Coverage', href: '#coverage' },
    { label: 'Speed Test', href: '#speedtest' },
    { label: 'Fibre Plans', href: '#plans' },
    { label: 'Business Wi-Fi', href: '#wifi' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-6">
        {/* Zone 1: Single Brand Lockup */}
        <a
          href="#top"
          aria-label="KP Informative Technologies Connect home"
          className="flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          {!logoError ? (
            <div className="w-[180px] h-12 sm:w-[220px] sm:h-14 overflow-hidden flex items-center justify-center rounded">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-24_at_08.34.47_102f6deb.jpeg"
                alt="KP Informative Technologies Connect"
                onError={() => setLogoError(true)}
                className="w-[144%] max-w-none h-auto shrink-0"
              />
            </div>
          ) : (
            <span className="font-display text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0">
              KPIT CONNECT
            </span>
          )}
        </a>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCheckAddressClick}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Check Coverage
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm font-medium text-slate-700 hover:text-slate-950"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onCheckAddressClick();
            }}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            Check Coverage
          </button>
        </div>
      )}
    </header>
  );
}
