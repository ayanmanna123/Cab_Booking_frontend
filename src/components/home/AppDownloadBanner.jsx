import React from 'react';
import { QrCode, ArrowRight } from 'lucide-react';

export default function AppDownloadBanner() {
  return (
    <section className="py-20 bg-[#f6f6f6] text-black select-none border-t border-neutral-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 space-y-10">
        <h2 className="text-3xl sm:text-[40px] font-black tracking-[-0.03em] text-black">
          It's easier in the apps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Rider app */}
          <div className="bg-white p-7 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center space-x-5">
              <div className="w-24 h-24 bg-black p-2 rounded-xl flex items-center justify-center shrink-0">
                <QrCode className="w-18 h-18 text-white" />
              </div>
              <div className="space-y-1.5 text-left">
                <h3 className="text-xl font-bold text-black">Download the Uber app</h3>
                <p className="text-xs text-neutral-500">Scan to download on iOS or Android</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 hidden sm:block" />
          </div>

          {/* Card 2: Driver app */}
          <div className="bg-white p-7 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center space-x-5">
              <div className="w-24 h-24 bg-black p-2 rounded-xl flex items-center justify-center shrink-0">
                <QrCode className="w-18 h-18 text-white" />
              </div>
              <div className="space-y-1.5 text-left">
                <h3 className="text-xl font-bold text-black">Download the Driver app</h3>
                <p className="text-xs text-neutral-500">Scan to download and start earning</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 hidden sm:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
