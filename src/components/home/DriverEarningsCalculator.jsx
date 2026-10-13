import React, { useState } from 'react';
import { DollarSign, Clock, ArrowRight, Zap, TrendingUp } from 'lucide-react';

export default function DriverEarningsCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(25);
  const [tier, setTier] = useState('UberX');

  const ratePerHour = {
    'UberX': 250,
    'Uber Comfort': 320,
    'UberXL': 420,
    'Uber Black': 600
  };

  const estimatedWeekly = hoursPerWeek * ratePerHour[tier];
  const estimatedMonthly = estimatedWeekly * 4;

  return (
    <section className="py-12 sm:py-20 bg-black text-white border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Controls */}
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              See what you could make driving in your city
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Adjust your expected driving hours to calculate your potential weekly and monthly payout with 80% net commissions.
            </p>

            {/* Hours Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span className="text-neutral-300">Hours driving per week</span>
                <span className="text-white text-sm sm:text-base font-bold">
                  {hoursPerWeek} hrs/week
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] sm:text-[11px] text-neutral-500">
                <span>Part-time (5 hrs)</span>
                <span>Full-time (40 hrs)</span>
                <span>Max (60 hrs)</span>
              </div>
            </div>

            {/* Vehicle Tier Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 block">
                Vehicle Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['UberX', 'Uber Comfort', 'UberXL', 'Uber Black'].map((vTier) => (
                  <button
                    key={vTier}
                    type="button"
                    onClick={() => setTier(vTier)}
                    className={`py-2 px-2.5 sm:px-3 text-xs font-bold rounded-lg border transition cursor-pointer text-center ${
                      tier === vTier
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {vTier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-neutral-950 border border-neutral-800 p-5 sm:p-8 rounded-xl sm:rounded-2xl flex flex-col justify-between space-y-6 sm:space-y-8 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Estimated Gross Driver Earnings</span>
              </div>

              <div>
                <div className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight break-words">
                  ₹{estimatedWeekly.toLocaleString('en-IN')}
                </div>
                <span className="text-xs text-neutral-400 font-medium">per week on average</span>
              </div>

              <div className="pt-4 border-t border-neutral-900 grid grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div>
                  <span className="text-neutral-500 block">Estimated Monthly</span>
                  <span className="text-base sm:text-lg font-bold text-neutral-200">₹{estimatedMonthly.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Average Hourly Rate</span>
                  <span className="text-base sm:text-lg font-bold text-neutral-200">₹{ratePerHour[tier]}/hr</span>
                </div>
              </div>
            </div>

            <div>
              <a
                href="/driver"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/driver');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl transition cursor-pointer"
              >
                <span>Start driving with {tier}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
              <p className="text-[10px] text-neutral-500 text-center mt-2.5">
                Estimates based on actual earnings data in urban metropolitan areas. Tips and bonuses not included.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
