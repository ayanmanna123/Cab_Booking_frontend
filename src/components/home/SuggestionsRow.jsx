import React from 'react';
import { Car, Calendar, Bike, Compass, Package, Plane } from 'lucide-react';

const offerings = [
  {
    id: 'ride',
    title: 'Ride',
    description: 'Go anywhere with Veyro. Request a ride, hop in, and go.',
    icon: Car,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'reserve',
    title: 'Reserve',
    description: 'Reserve your ride in advance so you can relax on the day of your trip.',
    icon: Calendar,
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'bike',
    title: 'Bike',
    description: 'Get affordable motorbike rides in minutes at your doorstep.',
    icon: Bike,
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'intercity',
    title: 'Intercity',
    description: 'Get convenient, affordable outstation cabs anytime at your door.',
    icon: Compass,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'parcel',
    title: 'Parcel',
    description: 'Veyro makes same-day item delivery easier than ever.',
    icon: Package,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'airport',
    title: 'Airport',
    description: 'Request a ride to or from the airport with room for your luggage.',
    icon: Plane,
    image: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=300&auto=format&fit=crop&q=80'
  }
];

export default function SuggestionsRow() {
  return (
    <section className="py-12 sm:py-16 bg-black text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Official Headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] text-white mb-6 sm:mb-8">
          Explore what you can do with Veyro
        </h2>

        {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {offerings.map((item) => {
            return (
              <div
                key={item.id}
                className="bg-[#1f1f1f] hover:bg-[#282828] p-5 sm:p-6 rounded-2xl flex flex-col justify-between min-h-[190px] sm:min-h-[210px] transition duration-200 border border-transparent hover:border-neutral-700 relative overflow-hidden group"
              >
                {/* Content */}
                <div className="space-y-1.5 sm:space-y-2 z-10 max-w-[60%] sm:max-w-[65%] pr-1">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                {/* Details Button */}
                <div className="z-10 pt-3 sm:pt-4">
                  <a
                    href="#ride"
                    className="inline-block px-4 py-2 sm:px-5 sm:py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition shadow-sm active:scale-95"
                  >
                    Details
                  </a>
                </div>

                {/* Graphic Illustration */}
                <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl overflow-hidden pointer-events-none opacity-85 group-hover:scale-105 group-hover:opacity-100 transition duration-300">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
