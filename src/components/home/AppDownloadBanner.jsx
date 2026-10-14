import React from 'react';
import { QrCode, ArrowRight } from 'lucide-react';

export default function AppDownloadBanner() {
  return (
    <section className="py-12 sm:py-20 bg-[#f6f6f6] text-black select-none border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-black tracking-[-0.03em] text-black">
          It's easier in the apps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {/* Card 1: Rider app */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-neutral-200 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center space-x-4 sm:space-x-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-black p-2 rounded-xl flex items-center justify-center shrink-0">
                <QrCode className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white" />
              </div>
              <div className="space-y-1 text-left min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-black truncate">Download the Veyro app</h3>
                <p className="text-xs text-neutral-500 line-clamp-2">Scan to download on iOS or Android</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 shrink-0 hidden sm:block" />
          </div>

          {/* Card 2: Driver app */}
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-neutral-200 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center space-x-4 sm:space-x-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-black p-2 rounded-xl flex items-center justify-center shrink-0">
                <QrCode className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white" />
              </div>
              <div className="space-y-1 text-left min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-black truncate">Download the Veyro Driver app</h3>
                <p className="text-xs text-neutral-500 line-clamp-2">Scan to download and start earning</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 shrink-0 hidden sm:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
