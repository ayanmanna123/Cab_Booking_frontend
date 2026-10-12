export const CONFIG = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RtUJGLxHs65Nb5NPIGLRsh07LUNlT8viI6QXKv7x3Qt8ECcgRJcu3KwZWxB6WOCHv6doAUJ4P3Gcho6RHLtK9aR00e0SsDeag',
  DEFAULT_CENTER: [37.7749, -122.4194], // San Francisco
  DEFAULT_CITY: 'San Francisco, CA'
};
