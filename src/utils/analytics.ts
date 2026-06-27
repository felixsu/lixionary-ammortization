// Declare gtag globally in TypeScript window interface
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export interface LoanTrackingData {
  loan_type: 'KPR' | 'KKB';
  asset_price: number;
  down_payment: number;
  loan_amount: number;
  tenor_years: number;
}

/**
 * Tracks a custom event in Google Analytics.
 */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, params);
  }
}

/**
 * Helper to track loan calculation details.
 */
export function trackLoanCalculation(data: LoanTrackingData) {
  trackEvent('calculate_loan', {
    ...data,
  });
}
