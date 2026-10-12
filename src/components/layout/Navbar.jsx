import React, { useState } from 'react';
import { Menu, X, Globe, HelpCircle, ChevronDown, Car, Shield } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from '@clerk/clerk-react';

export default function Navbar({ activeTab = 'ride', onSelectTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdown, setAboutDropdown] = useState(false);

  const handleNav = (tab) => {
    let path = '/';
    if (tab === 'drive' || tab === 'driver') {
      path = '/driver';
    } else if (tab === 'ride') {
      path = '/';
    } else {
      path = `/${tab}`;
    }
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (onSelectTab) {
      onSelectTab(tab === 'driver' ? 'drive' : tab);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-black text-white select-none border-b border-neutral-900/60 backdrop-blur-md bg-black/95">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Left: Uber Wordmark & Nav Links */}
          <div className="flex items-center space-x-7">
            <button
              onClick={() => handleNav('ride')}
              className="flex items-center group cursor-pointer focus:outline-none"
            >
              <span className="text-[26px] font-black tracking-[-0.04em] text-white">
                Uber
              </span>
            </button>

            <nav className="hidden md:flex items-center space-x-1">
              <button
                id="nav-ride-tab"
                onClick={() => handleNav('ride')}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition cursor-pointer ${
                  activeTab === 'ride'
                    ? 'text-white bg-neutral-900'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/50'
                }`}
              >
                Ride
              </button>
              <button
                id="nav-drive-tab"
                onClick={() => handleNav('drive')}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'drive'
                    ? 'text-white bg-neutral-900'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/50'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Drive</span>
              </button>
              <a
                href="#business"
                className="px-3.5 py-2 text-sm font-medium rounded-md text-neutral-300 hover:text-white hover:bg-neutral-900/50 transition"
              >
                Business
              </a>
              <div className="relative">
                <button
                  onClick={() => setAboutDropdown(!aboutDropdown)}
                  className="flex items-center space-x-1 px-3.5 py-2 text-sm font-medium rounded-md text-neutral-300 hover:text-white hover:bg-neutral-900/50 transition cursor-pointer"
                >
                  <span>About</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {aboutDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded-xl py-2 shadow-2xl z-50 text-xs">
                    <a href="#about" onClick={() => setAboutDropdown(false)} className="block px-4 py-2 hover:bg-neutral-800 text-neutral-200">About us</a>
                    <a href="#safety" onClick={() => setAboutDropdown(false)} className="block px-4 py-2 hover:bg-neutral-800 text-neutral-200">Safety</a>
                    <a href="#newsroom" onClick={() => setAboutDropdown(false)} className="block px-4 py-2 hover:bg-neutral-800 text-neutral-200">Newsroom</a>
                    <a href="#careers" onClick={() => setAboutDropdown(false)} className="block px-4 py-2 hover:bg-neutral-800 text-neutral-200">Careers</a>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Language, Help, Log in, Sign up */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-900 rounded-md transition cursor-pointer">
              <Globe className="w-4 h-4" />
              <span>EN</span>
            </button>

            <a
              href="#help"
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-900 rounded-md transition"
            >
              Help
            </a>

            {/* Clerk Authentication */}
            <SignedIn>
              <div className="flex items-center space-x-3 pl-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-900 rounded-md transition cursor-pointer">
                  Log in
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-neutral-200 rounded-md transition active:scale-95 shadow-sm cursor-pointer">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex md:hidden items-center space-x-2">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-300 hover:text-white transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-900 bg-black px-5 py-4 space-y-3">
          <button onClick={() => handleNav('ride')} className="block w-full text-left py-2 text-base font-semibold text-white">Ride</button>
          <button onClick={() => handleNav('drive')} className="block w-full text-left py-2 text-base font-semibold text-neutral-300">Drive (Driver Mode)</button>
          <a href="#business" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-semibold text-neutral-300">Business</a>
          <a href="#safety" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-semibold text-neutral-300">Safety</a>
          <div className="pt-3 border-t border-neutral-900 flex flex-col space-y-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full py-3 text-center text-sm font-semibold text-white bg-neutral-900 rounded-lg">
                  Log in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full py-3 text-center text-sm font-bold text-black bg-white rounded-lg">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}
