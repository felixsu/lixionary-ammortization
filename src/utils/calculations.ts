export interface KPRTier {
  id: string;
  name: string;
  durationYears: number;
  rate: number; // Annual rate in % (e.g., 5.0 for 5%)
}

export interface KPRInput {
  assetPrice: number;
  downPayment: number; // Absolute IDR
  tenorYears: number;
  tiers: KPRTier[];
  includeFees: boolean;
  fees: {
    provisionPercent: number; // e.g., 1.0%
    adminFlat: number;        // e.g., 1,000,000 IDR
    appraisalFlat: number;    // e.g., 1,500,000 IDR
    notaryPercent: number;    // e.g., 1.5%
    insurancePercent: number; // e.g., 1.0%
  };
}

export interface KKBInput {
  assetPrice: number;
  downPayment: number; // Absolute IDR
  tenorYears: number;
  flatRate: number; // Annual flat rate in % (e.g., 5.0 for 5%)
  includeFees: boolean;
  fees: {
    adminFlat: number;        // e.g., 2,000,000 IDR
    fiduciaryFlat: number;    // e.g., 500,000 IDR
    insurancePercent: number; // e.g., 2.5% of asset price
  };
}

export interface AmortizationRow {
  month: number;
  year: number;
  monthInYear: number;
  rate: number; // active annual rate in %
  beginningBalance: number;
  installment: number;
  principalPayment: number;
  interestPayment: number;
  endingBalance: number;
}

export interface KPROutput {
  principal: number;
  totalInterest: number;
  totalCostOfOwnership: number;
  schedule: AmortizationRow[];
  installmentsByTier: {
    tierId: string;
    tierName: string;
    startMonth: number; // 1-indexed
    endMonth: number;   // 1-indexed
    monthlyInstallment: number;
    rate: number;
  }[];
  fees: {
    provision: number;
    admin: number;
    appraisal: number;
    notary: number;
    insurance: number;
    totalFees: number;
  };
  totalCashRequired: number; // Down Payment + Total Fees
}

export interface KKBOutput {
  principal: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyInstallment: number;
  totalInterest: number;
  totalCostOfOwnership: number;
  equivalentEffectiveRate: number;
  schedule: AmortizationRow[];
  fees: {
    admin: number;
    fiduciary: number;
    insurance: number;
    totalFees: number;
  };
  totalCashRequired: number; // Down Payment + Total Fees
}

/**
 * Calculates the KPR (Annuity) amortization schedule.
 * Recomputes the installment whenever the interest rate changes.
 */
export function calculateKPR(input: KPRInput): KPROutput {
  const { assetPrice, downPayment, tenorYears, tiers, includeFees, fees } = input;
  const principal = Math.max(0, assetPrice - downPayment);
  const totalMonths = tenorYears * 12;

  // Calculate upfront fees
  const feeDetails = {
    provision: includeFees ? (principal * fees.provisionPercent) / 100 : 0,
    admin: includeFees ? fees.adminFlat : 0,
    appraisal: includeFees ? fees.appraisalFlat : 0,
    notary: includeFees ? (principal * fees.notaryPercent) / 100 : 0,
    insurance: includeFees ? (principal * fees.insurancePercent) / 100 : 0,
    totalFees: 0,
  };
  feeDetails.totalFees =
    feeDetails.provision +
    feeDetails.admin +
    feeDetails.appraisal +
    feeDetails.notary +
    feeDetails.insurance;

  const totalCashRequired = downPayment + feeDetails.totalFees;

  // Map each month index (1 to totalMonths) to its active tier
  const monthTiers: { tierIndex: number; tier: KPRTier }[] = [];
  let currentMonthCounter = 1;

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const durationMonths = Math.min(
      tier.durationYears * 12,
      totalMonths - currentMonthCounter + 1
    );
    for (let m = 0; m < durationMonths; m++) {
      monthTiers.push({ tierIndex: i, tier });
    }
    currentMonthCounter += durationMonths;
  }

  // Fallback if tiers do not cover the whole tenor
  while (monthTiers.length < totalMonths) {
    const lastTier = tiers[tiers.length - 1] || {
      id: 'fallback',
      name: 'Floating (Estimasi)',
      durationYears: 1,
      rate: 10,
    };
    monthTiers.push({ tierIndex: tiers.length - 1, tier: lastTier });
  }

  const schedule: AmortizationRow[] = [];
  const installmentsByTier: KPROutput['installmentsByTier'] = [];

  let remainingBalance = principal;
  let activeTierIndex = -1;
  let activeInstallment = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const { tierIndex, tier } = monthTiers[m - 1];
    const monthlyRate = tier.rate / 100 / 12;
    const remainingMonths = totalMonths - m + 1;

    // Recalculate monthly installment if we enter a new tier
    if (tierIndex !== activeTierIndex) {
      activeTierIndex = tierIndex;

      if (monthlyRate === 0) {
        activeInstallment = remainingBalance / remainingMonths;
      } else {
        const factor = Math.pow(1 + monthlyRate, remainingMonths);
        activeInstallment = remainingBalance * ((monthlyRate * factor) / (factor - 1));
      }

      // Record this tier's installment
      const existingTierInstallment = installmentsByTier.find(
        (x) => x.tierId === tier.id
      );
      if (!existingTierInstallment) {
        installmentsByTier.push({
          tierId: tier.id,
          tierName: tier.name,
          startMonth: m,
          endMonth: m + (tier.durationYears * 12) - 1,
          monthlyInstallment: activeInstallment,
          rate: tier.rate,
        });
      } else {
        // Adjust endMonth to reflect actual duration
        existingTierInstallment.endMonth = Math.min(
          totalMonths,
          existingTierInstallment.endMonth + 1
        );
      }
    }

    const beginningBalance = remainingBalance;
    const interestPayment = beginningBalance * monthlyRate;
    
    // Principal payment is the remaining installment minus interest, 
    // capped at the remaining balance to avoid negative final balances.
    let principalPayment = activeInstallment - interestPayment;
    if (principalPayment > beginningBalance || m === totalMonths) {
      principalPayment = beginningBalance;
    }
    
    const installment = principalPayment + interestPayment;
    remainingBalance = Math.max(0, beginningBalance - principalPayment);

    schedule.push({
      month: m,
      year: Math.ceil(m / 12),
      monthInYear: ((m - 1) % 12) + 1,
      rate: tier.rate,
      beginningBalance,
      installment,
      principalPayment,
      interestPayment,
      endingBalance: remainingBalance,
    });
  }

  // Adjust end months of the tiers to be within range
  installmentsByTier.forEach((t, index) => {
    if (index === 0) {
      t.startMonth = 1;
    } else {
      t.startMonth = installmentsByTier[index - 1].endMonth + 1;
    }
    // Calculate the duration from the tiers list
    const tierDurationMonths = (tiers.find(x => x.id === t.tierId)?.durationYears || 0) * 12;
    t.endMonth = Math.min(totalMonths, t.startMonth + tierDurationMonths - 1);
  });

  const totalInterest = schedule.reduce((sum, row) => sum + row.interestPayment, 0);

  return {
    principal,
    totalInterest,
    totalCostOfOwnership: assetPrice + totalInterest,
    schedule,
    installmentsByTier,
    fees: feeDetails,
    totalCashRequired,
  };
}

/**
 * Calculates the KKB (Flat) amortization schedule.
 * Interest is calculated flat based on initial principal.
 */
export function calculateKKB(input: KKBInput): KKBOutput {
  const { assetPrice, downPayment, tenorYears, flatRate, includeFees, fees } = input;
  const principal = Math.max(0, assetPrice - downPayment);
  const totalMonths = tenorYears * 12;

  // Calculate upfront fees
  const feeDetails = {
    admin: includeFees ? fees.adminFlat : 0,
    fiduciary: includeFees ? fees.fiduciaryFlat : 0,
    insurance: includeFees ? (assetPrice * fees.insurancePercent) / 100 : 0,
    totalFees: 0,
  };
  feeDetails.totalFees = feeDetails.admin + feeDetails.fiduciary + feeDetails.insurance;
  const totalCashRequired = downPayment + feeDetails.totalFees;

  // KKB Flat Calculations
  const monthlyPrincipal = principal / totalMonths;
  const totalInterest = (principal * (flatRate / 100) * tenorYears);
  const monthlyInterest = totalInterest / totalMonths;
  const monthlyInstallment = monthlyPrincipal + monthlyInterest;

  const schedule: AmortizationRow[] = [];
  let remainingBalance = principal;

  for (let m = 1; m <= totalMonths; m++) {
    const beginningBalance = remainingBalance;
    const interestPayment = monthlyInterest;
    
    let principalPayment = monthlyPrincipal;
    if (beginningBalance < principalPayment || m === totalMonths) {
      principalPayment = beginningBalance;
    }
    
    const installment = principalPayment + interestPayment;
    remainingBalance = Math.max(0, beginningBalance - principalPayment);

    schedule.push({
      month: m,
      year: Math.ceil(m / 12),
      monthInYear: ((m - 1) % 12) + 1,
      rate: flatRate,
      beginningBalance,
      installment,
      principalPayment,
      interestPayment,
      endingBalance: remainingBalance,
    });
  }

  // Find equivalent effective (annuity) annual rate
  const equivalentEffectiveRate = findEquivalentEffectiveRate(
    principal,
    totalMonths,
    monthlyInstallment
  );

  return {
    principal,
    monthlyPrincipal,
    monthlyInterest,
    monthlyInstallment,
    totalInterest,
    totalCostOfOwnership: assetPrice + totalInterest,
    equivalentEffectiveRate,
    schedule,
    fees: feeDetails,
    totalCashRequired,
  };
}

/**
 * Solve for effective monthly interest rate i using Bisection Method.
 * Converts to annual effective percentage rate.
 */
export function findEquivalentEffectiveRate(
  principal: number,
  totalMonths: number,
  monthlyInstallment: number
): number {
  if (principal <= 0 || totalMonths <= 0 || monthlyInstallment <= 0) return 0;
  if (monthlyInstallment * totalMonths <= principal) return 0; // No interest or negative interest

  // Solve: P * (i * (1+i)^N) / ((1+i)^N - 1) - M = 0
  let low = 0;
  let high = 1.5; // Up to 1800% annual rate

  const f = (r: number) => {
    if (r === 0) return principal / totalMonths - monthlyInstallment;
    const factor = Math.pow(1 + r, totalMonths);
    return principal * ((r * factor) / (factor - 1)) - monthlyInstallment;
  };

  // Ensure high bound brackets the root
  if (f(low) * f(high) > 0) {
    return high * 12 * 100;
  }

  // 60 iterations yields high precision
  for (let iter = 0; iter < 60; iter++) {
    const mid = (low + high) / 2;
    const val = f(mid);
    if (Math.abs(val) < 1e-12) {
      return mid * 12 * 100;
    }
    if (val < 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return ((low + high) / 2) * 12 * 100;
}
