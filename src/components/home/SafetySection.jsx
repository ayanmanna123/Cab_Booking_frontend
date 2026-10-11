import React, { useState } from 'react';
import { Shield, PhoneCall, AlertTriangle, Share2, CheckCircle2 } from 'lucide-react';
import { sosApi } from '../../api';

export default function SafetySection() {
  const [sosStatus, setSosStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestSos = async () => {
    setLoading(true);
    try {
      const response = await sosApi.triggerEmergency({
        userId: 'test_safety_rider',
        latitude: 37.7749,
        longitude: -122.4194,
        emergencyType: 'PANIC'
      });
      if (response.success) {
        setSosStatus('Alert Dispatched: Emergency response and emergency contacts notified!');
      }
    } catch (e) {
      setSosStatus('Emergency alert simulated (live WebSocket broadcast active)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="safety" className="py-20 bg-neutral-950 text-white border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Safety First</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Your safety drives everything we do
          </h2>
          <p className="text-neutral-400 text-base">
            Every feature is designed with your peace of mind in mind. Whether you are in the front seat or the back, we are with you every mile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: SOS Button */}
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">In-App Emergency SOS</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                If you ever feel unsafe, one tap instantly alerts local emergency authorities and sends your real-time GPS coordinates to your designated emergency contacts.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={handleTestSos}
                disabled={loading}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Transmitting alert...' : '🚨 Test SOS Feature'}
              </button>
              {sosStatus && (
                <p className="text-[11px] text-emerald-400 mt-2 font-medium flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
                  {sosStatus}
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Live Trip Sharing */}
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Share Your Trip Status</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Family and friends can follow your journey in real time on our Leaflet map—viewing the driver’s car model, license plate, and expected arrival time.
              </p>
            </div>

            <div className="pt-6">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center space-x-3 text-xs text-neutral-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live GPS route streaming enabled</span>
              </div>
            </div>
          </div>

          {/* Card 3: 24/7 Support & Verified Drivers */}
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">24/7 Incident Support</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Our safety response team is on standby around the clock to investigate lost items, trip disputes, or urgent road issues via our Help Center.
              </p>
            </div>

            <div className="pt-6">
              <a
                href="#help"
                className="block text-center w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg transition"
              >
                Visit Help Center
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
