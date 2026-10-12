import React from 'react';
import { Car, Calendar, Bike, Compass, Package, Plane } from 'lucide-react';

const offerings = [
  {
    id: 'ride',
    title: 'Ride',
    description: 'Go anywhere with Uber. Request a ride, hop in, and go.',
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
    description: 'Uber makes same-day item delivery easier than ever.',
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
    <section className="py-16 bg-black text-white select-none">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
        {/* Official Headline matching uber.com */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-white mb-8">
          Explore what you can do with Uber
        </h2>

        {/* 3x2 Grid matching official Uber card proportions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((item) => {
            return (
              <div
                key={item.id}
                className="bg-[#1f1f1f] hover:bg-[#282828] p-6 rounded-2xl flex flex-col justify-between h-[210px] transition duration-200 border border-transparent hover:border-neutral-700 relative overflow-hidden group"
              >
                {/* Content */}
                <div className="space-y-2 z-10 max-w-[65%]">
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Details Button */}
                <div className="z-10 pt-4">
                  <a
                    href="#ride"
                    className="inline-block px-5 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition shadow-sm active:scale-95"
                  >
                    Details
                  </a>
                </div>

                {/* Graphic Illustration */}
                <div className="absolute right-4 bottom-4 w-28 h-28 rounded-xl overflow-hidden pointer-events-none opacity-85 group-hover:scale-105 group-hover:opacity-100 transition duration-300">
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
