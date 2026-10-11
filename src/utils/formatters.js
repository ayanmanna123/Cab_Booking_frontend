/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format distance in kilometers or miles
 */
export function formatDistance(km, useMiles = true) {
  if (!km) return '0 mi';
  if (useMiles) {
    const miles = km * 0.621371;
    return `${miles.toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format minutes into readable ETA
 */
export function formatDuration(minutes) {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  return `${hrs} hr ${remainingMins} min`;
}

/**
 * Format timestamp into standard date/time
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(timestamp));
}
