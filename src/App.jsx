import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import RideTrackingPage from './pages/RideTrackingPage';
import { SocketProvider, RideProvider } from './context';

export default function App() {
  const [currentView, setCurrentView] = useState('ride'); // 'ride' | 'drive' | 'tracking'
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'drive' || hash === 'ride' || hash === 'tracking') {
        setCurrentView(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (tab) => {
    setCurrentView(tab);
  };

  return (
    <SocketProvider>
      <RideProvider>
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
                onBackToHome={() => setCurrentView('ride')}
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
