export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center justify-center bg-white rounded-lg px-3 py-1.5 shadow-sm">
              <div className="w-[216px] h-14 overflow-hidden flex items-center justify-center">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-11-24_at_08.34.47_102f6deb.jpeg"
                  alt="KP Informative Technologies Connect"
                  className="w-[144%] max-w-none h-auto shrink-0"
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Head Office: Johannesburg, Gauteng <span aria-hidden="true" className="mx-1.5">·</span> Fibre &amp; Business Wi-Fi Across South Africa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a href="#coverage" className="hover:text-white transition-colors">
              Coverage Map
            </a>
            <a href="#speedtest" className="hover:text-white transition-colors">
              Speed Test
            </a>
            <a href="#plans" className="hover:text-white transition-colors">
              Fibre Plans
            </a>
            <a href="#wifi" className="hover:text-white transition-colors">
              Business Wi-Fi
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} KP Informative Technologies Connect (Pty) Ltd. All rights reserved. Offices based exclusively in Johannesburg, South Africa.
          </p>
          <p>Johannesburg NOC: 087 055 4200 · support@kpitconnect.co.za</p>
        </div>
      </div>
    </footer>
  );
}

