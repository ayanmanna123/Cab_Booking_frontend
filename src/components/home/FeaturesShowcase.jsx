import React from 'react';
import { ArrowRight, Briefcase, BarChart3, ClipboardList } from 'lucide-react';

export default function FeaturesShowcase() {
  return (
    <div className="select-none">
      {/* 1. Three Feature Promo Cards on Dark Background */}
      <section className="py-12 sm:py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Plan trip in advance */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden h-44 sm:h-52 relative group">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop"
                  alt="Plan trip in advance"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-4 left-4 w-12 h-12 sm:w-14 sm:h-14 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center p-2 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1550355291-bbee04a92027?w=120"
                    alt="Car"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Plan your trip in advance</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Book your ride up to 90 days ahead by choosing Reserve on Veyro or in the app.
              </p>
              <div>
                <a href="#ride" className="inline-block text-sm font-semibold text-white underline underline-offset-4 hover:text-neutral-300">
                  Reserve now
                </a>
              </div>
            </div>

            {/* Card 2: Ride in style */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden h-44 sm:h-52 relative group">
                <img
                  src="https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=800&auto=format&fit=crop"
                  alt="Ride in style"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-4 left-4 w-12 h-12 sm:w-14 sm:h-14 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center p-2 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1563720223185-11003d516935?w=120"
                    alt="Luxury car"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Ride in style</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Travel in high-end vehicles with our top-rated chauffeurs and extra legroom.
              </p>
              <div>
                <a href="#ride" className="inline-block text-sm font-semibold text-white underline underline-offset-4 hover:text-neutral-300">
                  See prices
                </a>
              </div>
            </div>

            {/* Card 3: Send items within the day */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden h-44 sm:h-52 relative group">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop"
                  alt="Send items within the day"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-4 left-4 w-12 h-12 sm:w-14 sm:h-14 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center p-2 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120"
                    alt="Package"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Send items within the day</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Get same-day local delivery of forgotten keys, care packages, and much more.
              </p>
              <div>
                <a href="#ride" className="inline-block text-sm font-semibold text-white underline underline-offset-4 hover:text-neutral-300">
                  Send a package
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Official "Earn with Veyro" Section on Clean White Background */}
      <section id="drive" className="py-14 sm:py-20 bg-white text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-black tracking-[-0.03em] text-black">
            Earn with Veyro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Drive and earn on your schedule */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden h-52 sm:h-64 border border-neutral-200">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=900&auto=format&fit=crop"
                  alt="Driver"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-black">Drive and earn on your schedule</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Make money with rides. Use your car or rent one through partner fleets. Instant earnings to Stripe.
              </p>
              <div>
                <a
                  href="/driver"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/driver');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-block text-sm font-semibold text-black underline underline-offset-4 hover:opacity-75 cursor-pointer"
                >
                  Sign up to drive
                </a>
              </div>
            </div>

            {/* Specialized skills */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden h-52 sm:h-64 border border-neutral-200">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=900&auto=format&fit=crop"
                  alt="Remote work"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-black">Earn with your specialized skills</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Turn your expertise into flexible earning opportunities with Veyro partner programs.
              </p>
              <div>
                <a
                  href="/driver"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/driver');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-block text-sm font-semibold text-black underline underline-offset-4 hover:opacity-75 cursor-pointer"
                >
                  Sign up
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Official "Veyro for Business" Section on Clean White Background */}
      <section id="business" className="py-14 sm:py-20 bg-white text-black border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Visual with portrait and 3 floating badge cards */}
            <div className="relative flex justify-center pb-6 sm:pb-8 lg:pb-0">
              <div className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[380px] lg:h-[380px] rounded-full overflow-hidden border-4 border-neutral-100 shadow-xl relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
                  alt="Business executive in car"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 3 Floating black badges matching screenshot */}
              <div className="absolute -bottom-3 sm:-bottom-5 flex space-x-2 sm:space-x-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-black rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl border border-neutral-800">
                  <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-blue-400" />
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-black rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl border border-neutral-800">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-emerald-400" />
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-black rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl border border-neutral-800">
                  <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-5 sm:space-y-6 pt-4 lg:pt-0">
              <h2 className="text-2xl sm:text-3xl lg:text-[44px] font-black tracking-[-0.03em] text-black leading-tight">
                All the benefits of Veyro, reimagined for business
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Veyro for Business gives your organization more control, deeper insights, and features built for enterprise users. Manage and track business travel, meal programs, and more on one dashboard.
              </p>
              <div>
                <a
                  href="#business"
                  className="inline-block px-6 sm:px-7 py-3 sm:py-3.5 bg-black text-white font-bold text-sm rounded-lg hover:bg-neutral-800 transition"
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
