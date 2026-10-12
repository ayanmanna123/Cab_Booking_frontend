import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import RideTrackingPage from './pages/RideTrackingPage';
import { SocketProvider, RideProvider } from './context';

import UserAuthSync from './components/auth/UserAuthSync';

export default function App() {
  const [currentView, setCurrentView] = useState('ride'); // 'ride' | 'drive' | 'tracking'
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    const handleRoute = () => {
      let path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.replace('#', '').toLowerCase();

      // Clean up legacy hash if present (e.g. #drive -> /driver, #dashboard -> /dashboard)
      if (hash) {
        let cleanPath = '/';
        if (hash === 'drive' || hash === 'driver') cleanPath = '/driver';
        else if (hash === 'dashboard') cleanPath = '/dashboard';
        else if (hash === 'tracking') cleanPath = '/tracking';
        window.history.replaceState({}, '', cleanPath);
        path = cleanPath;
      }

      if (path === '/driver' || path === '/drive' || path === '/dashboard') {
        setCurrentView('drive');
      } else if (path === '/tracking') {
        setCurrentView('tracking');
      } else {
        setCurrentView('ride');
      }
    };

    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('popstate', handleRoute);
    return () => {
      window.removeEventListener('hashchange', handleRoute);
      window.removeEventListener('popstate', handleRoute);
    };
  }, []);

  const handleNavigate = (tab) => {
    let path = '/';
    if (tab === 'drive' || tab === 'driver') path = '/driver';
    else if (tab === 'dashboard') path = '/dashboard';
    else if (tab === 'tracking') path = '/tracking';
    else path = '/';

    window.history.pushState({}, '', path);
    setCurrentView(tab === 'driver' ? 'drive' : tab);
  };

  return (
    <SocketProvider>
      <RideProvider>
        <UserAuthSync />
        <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
          {/* Header Navigation with Tab Switching (Ride vs Drive) */}
          <Navbar activeTab={currentView} onSelectTab={handleNavigate} />

          {/* Active View */}
          <main className="flex-1">
            {currentView === 'ride' && <HomePage />}
            {currentView === 'drive' && <DriverDashboardPage />}
            {currentView === 'tracking' && (
              <RideTrackingPage
                ride={activeRide}
                onBackToHome={() => handleNavigate('ride')}
              />
            )}
          </main>

          {/* Global Uber Footer */}
          <Footer />
        </div>
      </RideProvider>
    </SocketProvider>
  );
}
