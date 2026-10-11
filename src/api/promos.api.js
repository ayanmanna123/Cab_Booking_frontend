import { apiClient } from './apiClient';

export const promosApi = {
  /**
   * Validate promo code and get discount info
   */
  validatePromo: async (code, fareAmount) => {
    return apiClient.post('/promos/validate', {
      code,
      fareAmount
    });
  }
};
