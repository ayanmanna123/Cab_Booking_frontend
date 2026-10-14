import React from 'react';
import { Globe, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-12 sm:pt-16 pb-8 sm:pb-12 select-none border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-6 sm:pb-8 gap-4">
          <div className="flex items-center space-x-2.5">
            <img
              src="/Logo 4.avif"
              alt="Veyro Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg"
            />
            <span className="text-2xl sm:text-[28px] font-black tracking-[-0.04em]">Veyro</span>
          </div>
          <a
            href="#help"
            className="text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white underline underline-offset-4"
          >
            Visit Help Center
          </a>
        </div>

        {/* 4 Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-sm">
          <div className="space-y-3">
            <h4 className="font-bold text-sm sm:text-base text-white">Company</h4>
            <ul className="space-y-2 text-neutral-400 text-xs">
              <li><a href="#about" className="hover:text-white transition">About us</a></li>
              <li><a href="#offerings" className="hover:text-white transition">Our offerings</a></li>
              <li><a href="#newsroom" className="hover:text-white transition">Newsroom</a></li>
              <li><a href="#investors" className="hover:text-white transition">Investors</a></li>
              <li><a href="#blog" className="hover:text-white transition">Blog</a></li>
              <li><a href="#careers" className="hover:text-white transition">Careers</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm sm:text-base text-white">Products</h4>
            <ul className="space-y-2 text-neutral-400 text-xs">
              <li><a href="/" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-white transition cursor-pointer">Ride</a></li>
              <li><a href="/history" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/history'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-white transition cursor-pointer">Activity & History</a></li>
              <li><a href="/driver" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/driver'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-white transition cursor-pointer">Drive</a></li>
              <li><a href="#deliver" className="hover:text-white transition">Deliver</a></li>
              <li><a href="#eats" className="hover:text-white transition">Eat</a></li>
              <li><a href="#business" className="hover:text-white transition">Veyro for Business</a></li>
              <li><a href="#freight" className="hover:text-white transition">Veyro Freight</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm sm:text-base text-white">Global citizenship</h4>
            <ul className="space-y-2 text-neutral-400 text-xs">
              <li><a href="#safety" className="hover:text-white transition">Safety</a></li>
              <li><a href="#diversity" className="hover:text-white transition">Diversity and Inclusion</a></li>
              <li><a href="#sustainability" className="hover:text-white transition">Sustainability</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-sm sm:text-base text-white">Travel</h4>
            <ul className="space-y-2 text-neutral-400 text-xs">
              <li><a href="#reserve" className="hover:text-white transition">Reserve</a></li>
              <li><a href="#airports" className="hover:text-white transition">Airports</a></li>
              <li><a href="#cities" className="hover:text-white transition">Cities</a></li>
            </ul>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 text-xs font-semibold text-neutral-300">
          <button className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 rounded-lg transition cursor-pointer">
            <Globe className="w-4 h-4 shrink-0" />
            <span>English</span>
          </button>
          <button className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 rounded-lg transition cursor-pointer">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>San Francisco</span>
          </button>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 sm:pt-8 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 gap-4 text-center md:text-left">
          <p>© 2026 Veyro Technologies Inc.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-neutral-400 cursor-pointer"
            >
              Privacy Policy
            </a>
            <a href="#accessibility" className="hover:text-neutral-400">Accessibility</a>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-neutral-400 cursor-pointer"
            >
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
