import { apiClient } from './apiClient';

export const paymentsApi = {
  /**
   * Create Stripe Payment Intent for a ride
   */
  createPaymentIntent: async ({ rideId, amount, currency = 'usd', paymentMethod = 'stripe' }) => {
    return apiClient.post('/payments/create-intent', {
      rideId,
      amount,
      currency,
      paymentMethod
    });
  },

  /**
   * Confirm successful payment on backend
   */
  confirmPayment: async ({ paymentIntentId, rideId }) => {
    return apiClient.post('/payments/confirm', {
      paymentIntentId,
      rideId
    });
  }
};
