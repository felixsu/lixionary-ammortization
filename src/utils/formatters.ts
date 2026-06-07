/**
 * Formats a number as Indonesian Rupiah (IDR).
 * If includeDecimals is true, it includes 2 decimal places.
 * If includeDecimals is false, it rounds to the nearest Rupiah.
 */
export function formatIDR(value: number, includeDecimals = false): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(value);
}

/**
 * Formats a number as a percentage (e.g., 5.5 -> "5,50%").
 */
export function formatPercent(value: number, decimals = 2): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value) + '%';
}

/**
 * Compact formatter for larger figures (e.g. 1.2M or 1,2 Miliar)
 * In Indonesia: 
 * - Juta (Million, M / Jt)
 * - Miliar (Billion, M)
 * - Triliun (Trillion, T)
 */
export function formatCompactIDR(value: number): string {
  if (value >= 1e12) {
    return `Rp ${(value / 1e12).toFixed(2)} T`;
  }
  if (value >= 1e9) {
    return `Rp ${(value / 1e9).toFixed(2)} M`;
  }
  if (value >= 1e6) {
    return `Rp ${(value / 1e6).toFixed(1)} Jt`;
  }
  return formatIDR(value, false);
}
