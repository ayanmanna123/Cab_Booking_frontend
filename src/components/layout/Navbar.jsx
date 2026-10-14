import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Globe,
  HelpCircle,
  ChevronDown,
  Car,
  Shield,
  Clock,
  Briefcase,
  Info
} from 'lucide-react';
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

  // Prevent background scrolling when mobile navigation drawer is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setAboutDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    setAboutDropdown(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-black text-white select-none border-b border-neutral-900/80 backdrop-blur-md bg-black/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Veyro Wordmark & Nav Links */}
          <div className="flex items-center space-x-4 sm:space-x-7 min-w-0">
            <button
              onClick={() => handleNav('ride')}
              className="flex items-center space-x-2.5 group cursor-pointer focus:outline-none shrink-0"
              aria-label="Veyro Home"
            >
              <img
                src="/Logo 4.avif"
                alt="Veyro Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg"
              />
              <span className="text-2xl sm:text-[26px] font-black tracking-[-0.03em] text-white">
                Veyro
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 shrink-0">
              <button
                id="nav-ride-tab"
                onClick={() => handleNav('ride')}
                className={`px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-md transition cursor-pointer ${
                  activeTab === 'ride'
                    ? 'text-white bg-neutral-900'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                Ride
              </button>
              <button
                id="nav-drive-tab"
                onClick={() => handleNav('drive')}
                className={`px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'drive'
                    ? 'text-white bg-neutral-900'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Drive</span>
              </button>
              <button
                id="nav-history-tab"
                onClick={() => handleNav('history')}
                className={`px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'history'
                    ? 'text-white bg-neutral-900'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Activity</span>
              </button>
              <a
                href="#business"
                className="px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-md text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition"
              >
                Business
              </a>
              <div className="relative">
                <button
                  onClick={() => setAboutDropdown(!aboutDropdown)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-md text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition cursor-pointer"
                  aria-expanded={aboutDropdown}
                >
                  <span>About</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aboutDropdown ? 'rotate-180' : ''}`} />
                </button>
                {aboutDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 w-48 bg-neutral-900 border border-neutral-800 rounded-xl py-2 shadow-2xl z-50 text-xs">
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
          <div className="hidden md:flex items-center space-x-3 shrink-0">
            <button
              type="button"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-900 rounded-md transition cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>EN</span>
            </button>

            <a
              href="#help"
              className="px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-900 rounded-md transition"
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
                <button className="px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-900 rounded-md transition cursor-pointer">
                  Log in
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="px-4 py-1.5 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-md transition active:scale-95 shadow-sm cursor-pointer">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
          </div>

          {/* Mobile Actions: User button + Hamburger Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <SignedIn>
              <div className="scale-90">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition cursor-pointer focus:outline-none"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 md:hidden bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-neutral-950 border-b border-neutral-800 max-h-[calc(100vh-64px)] overflow-y-auto px-5 py-5 space-y-4 shadow-2xl">
            {/* Primary Nav Links */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 px-3 block mb-1">
                Navigation
              </span>

              <button
                onClick={() => handleNav('ride')}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === 'ride'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Car className="w-4 h-4" />
                  <span>Ride (Book Trips)</span>
                </div>
                {activeTab === 'ride' && (
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                )}
              </button>

              <button
                onClick={() => handleNav('drive')}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === 'drive'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Car className="w-4 h-4" />
                  <span>Drive (Driver Portal)</span>
                </div>
                {activeTab === 'drive' && (
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                )}
              </button>

              <button
                onClick={() => handleNav('history')}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4" />
                  <span>Activity & Ride History</span>
                </div>
                {activeTab === 'history' && (
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                )}
              </button>

              <a
                href="#business"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold text-neutral-200 hover:bg-neutral-900 flex items-center space-x-3 transition block"
              >
                <Briefcase className="w-4 h-4 text-neutral-400" />
                <span>Veyro for Business</span>
              </a>

              <a
                href="#safety"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold text-neutral-200 hover:bg-neutral-900 flex items-center space-x-3 transition block"
              >
                <Shield className="w-4 h-4 text-neutral-400" />
                <span>Rider & Driver Safety</span>
              </a>
            </div>

            {/* Quick Utility Section: Language & Help */}
            <div className="pt-3 border-t border-neutral-900 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 px-3 block mb-1">
                Preferences & Support
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white flex items-center space-x-2 justify-center"
                >
                  <Globe className="w-4 h-4 text-neutral-400" />
                  <span>English (EN)</span>
                </button>
                <a
                  href="#help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white flex items-center space-x-2 justify-center"
                >
                  <HelpCircle className="w-4 h-4 text-neutral-400" />
                  <span>Help Center</span>
                </a>
              </div>
            </div>

            {/* Authentication Buttons on Mobile */}
            <SignedOut>
              <div className="pt-3 border-t border-neutral-900 flex flex-col space-y-2.5">
                <SignInButton mode="modal">
                  <button className="w-full min-h-[44px] py-3 text-center text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition cursor-pointer">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full min-h-[44px] py-3 text-center text-sm font-bold text-black bg-white hover:bg-neutral-200 rounded-xl transition cursor-pointer shadow-md">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}
