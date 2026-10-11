export const RIDE_STATUS = {
  PENDING: 'PENDING',
  SEARCHING: 'SEARCHING',
  ACCEPTED: 'ACCEPTED',
  ARRIVING: 'ARRIVING',
  ARRIVED: 'ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

export const VEHICLE_TIERS = [
  {
    id: 'uberx',
    name: 'UberX',
    description: 'Affordable, everyday rides',
    capacity: 4,
    multiplier: 1.0,
    etaMinutes: 3,
    icon: 'car'
  },
  {
    id: 'comfort',
    name: 'Uber Comfort',
    description: 'Newer cars with extra legroom',
    capacity: 4,
    multiplier: 1.25,
    etaMinutes: 5,
    icon: 'car-front'
  },
  {
    id: 'uberxl',
    name: 'UberXL',
    description: 'Affordable rides for groups up to 6',
    capacity: 6,
    multiplier: 1.6,
    etaMinutes: 6,
    icon: 'bus'
  },
  {
    id: 'black',
    name: 'Uber Black',
    description: 'Premium rides in luxury vehicles with top-rated drivers',
    capacity: 4,
    multiplier: 2.2,
    etaMinutes: 8,
    icon: 'crown'
  }
];
