export interface RoiInputs {
  /** Total number of magnets to deploy (M_total) */
  totalMagnets: number
  /** Number of paid subscribers (for current state, and capping logic) */
  paidSubscribers: number
  /** Number of free subscribers (for current state, and capping logic) */
  freeSubscribers: number
  /** Average monthly revenue per paid subscriber (P) */
  arppuMonthlyUsd: number
  /** Average lifetime of a paid subscriber in months (L0) */
  avgLifetimeMonths: number
  /** Which plan strategy the user selected */
  planChoice: "growth_only" | "growth_and_retention"
}

export interface RoiConfig {
  /** Gross Margin (GM), default 0.8 */
  grossMargin: number
  /** Creator revenue share (share), default 0.10 */
  fcShare: number
  /** Cost per magnet in USD, default 10 */
  costPerMagnetUsd: number
  /** Conversion rate for growth track (delta_c), e.g. 0.10 for 10% */
  conversionRateGrowth: number
  /** Churn improvement ratio (u), e.g. 0.10 for 10% improvement */
  churnImprovement: number
  /** Coverage ratio for retention (a), proportion of paid users who adopt habit */
  retentionCoverage: number
  /** Default horizon for ROI calculation in months (12) */
  horizonMonths: number
}

export const DEFAULT_CONFIG: RoiConfig = {
  grossMargin: 0.8,
  fcShare: 0.10,
  costPerMagnetUsd: 20, // Updated to $20 as per Premium Validator strategy
  // Section 8.3: "In most real parameters (Δc≈8–12%)..." -> 0.10
  conversionRateGrowth: 0.10,
  // Section 3.4: "10%-15%" -> 0.10 conservative
  churnImprovement: 0.08,
  // Section 3.4: "0-1" -> 0.5 conservative assumption
  retentionCoverage: 0.5,
  horizonMonths: 12,
}

export interface RoiResults {
  allocation: {
    free: number
    paid: number
  }
  growth: {
    magnetsFree: number
    newPaidUsers: number
    revenue12m: number
    profit12m: number
    isProfitable: boolean
  }
  retention: {
    magnetsPaid: number
    deltaL: number
    deltaLEffective: number
    extraUserMonths12m: number
    profit12m: number
  }
  total: {
    pilotCost: number
    netGain12m: number
    roi12m: number // multiplier (e.g. 1.5x)
    paybackMonths: number
  }
}

/**
 * Calculates allocation based on Section 8.3:
 * M_paid = max(200, 15% * M_total)
 * M_free = M_total - M_paid
 * With guardrails for actual subscriber counts.
 */
export function calculateAllocation(
  inputs: RoiInputs,
  config: RoiConfig = DEFAULT_CONFIG
): { free: number; paid: number } {
  const { totalMagnets, paidSubscribers, freeSubscribers } = inputs

  // Rule:
  // - If Plan A (Growth Only): 100% Free, 0% Paid.
  // - If Plan B (Growth + Retention): Mix (default 15% Paid, min 200).

  let mPaid = 0;
  if (inputs.planChoice === "growth_and_retention") {
    // Rule 8.3: M_paid = max(200, 15% * M_total)
    mPaid = Math.max(200, Math.round(inputs.totalMagnets * 0.15))
  }

  // Guardrail: Cannot deploy more paid magnets than paid subscribers
  if (mPaid > paidSubscribers) {
    mPaid = paidSubscribers
  }

  let mFree = totalMagnets - mPaid

  // Guardrail: Cannot deploy more free magnets than free subscribers
  if (mFree > freeSubscribers) {
    mFree = freeSubscribers
    // If we have leftover magnets and plenty of paid subs, maybe shift back?
    // Doc doesn't specify overflow logic, but let's just cap for now to be safe.
    // If capped, total deployed might be less than totalMagnets requested?
    // Let's assume we fill up.
  }

  return { free: mFree, paid: mPaid }
}

/**
 * Recommends pilot size based on Monthly Revenue Capacity.
 * Logic:
 * - Rev > $80k -> 3000 magnets
 * - Rev > $40k -> 2000 magnets
 * - Else -> 1500 magnets (Minimum)
 */
export function recommendPilotSize(inputs: RoiInputs): number {
  const monthlyRevenue = inputs.paidSubscribers * inputs.arppuMonthlyUsd

  if (monthlyRevenue >= 80000) return 3000
  if (monthlyRevenue >= 40000) return 2000
  return 1500
}

export function calculateRoi(inputs: RoiInputs, config: RoiConfig = DEFAULT_CONFIG): RoiResults {
  const {
    grossMargin,
    fcShare,
    costPerMagnetUsd,
    conversionRateGrowth,
    churnImprovement,
    retentionCoverage,
    horizonMonths
  } = config

  const { arppuMonthlyUsd, avgLifetimeMonths } = inputs

  // 1. Calculate Allocation
  const allocation = calculateAllocation(inputs, config)
  const M_free = allocation.free
  const M_paid = allocation.paid
  const pilotCost = (M_free + M_paid) * costPerMagnetUsd

  // Key Constant K (Section 3.2): Net profit per paid-user-month for creator
  // K = P * (1 - share) * GM
  const K = arppuMonthlyUsd * (1 - fcShare) * grossMargin

  // --- Track A: Growth (Section 4) ---
  // A1. New Paid Users
  const newPaidUsers = M_free * conversionRateGrowth

  // A2. Revenue (12m)
  // Revenue = NewPaid * P * 12
  const growthRevenue12m = newPaidUsers * arppuMonthlyUsd * horizonMonths // Using horizon (12)

  // A3. Profit (12m)
  // Profit = NewPaid * (K * 12)
  // Note: Formula 4.A3 matches this.
  const growthProfit12m = newPaidUsers * (K * horizonMonths)

  // Break-even check for free (Section 7.1)
  // condition: delta_c >= cost / (K * 12)
  const growthBreakEvenThreshold = costPerMagnetUsd / (K * horizonMonths)
  const isGrowthProfitable = conversionRateGrowth >= growthBreakEvenThreshold


  // --- Track B: Retention (Section 5) ---
  // Step R1: Churn -> Delta L
  // deltaL = (u / (1 - u)) * L0
  // Note: denominator is (1-u), so if u=0.1, it is 0.9.
  const deltaL = (churnImprovement / (1 - churnImprovement)) * avgLifetimeMonths
  const deltaLEffective = retentionCoverage * deltaL

  // Step R2: Extra usage months (12m)
  // We calculate "how many extra months" total.
  // Note: This model is linear estimate. 
  // Formula 5.2 R2: Extra_months = M_paid * deltaL_effective
  const extraUserMonths12m = M_paid * deltaLEffective

  // Step R3: Retention Profit
  // Profit = Extra_months * K
  const retentionProfit12m = extraUserMonths12m * K


  // --- Total ROI (Section 6) ---
  const totalProfit12m = growthProfit12m + retentionProfit12m
  const netGain12m = totalProfit12m - pilotCost

  const roi12m = pilotCost > 0 ? (netGain12m / pilotCost) : 0

  // Payback Months
  // Payback = Cost / (TotalProfit / 12)
  const monthlyProfitRunRate = totalProfit12m / horizonMonths
  const paybackMonths = monthlyProfitRunRate > 0 ? pilotCost / monthlyProfitRunRate : 0

  return {
    allocation,
    growth: {
      magnetsFree: M_free,
      newPaidUsers,
      revenue12m: growthRevenue12m,
      profit12m: growthProfit12m,
      isProfitable: isGrowthProfitable
    },
    retention: {
      magnetsPaid: M_paid,
      deltaL,
      deltaLEffective,
      extraUserMonths12m,
      profit12m: retentionProfit12m
    },
    total: {
      pilotCost,
      netGain12m,
      roi12m,
      paybackMonths
    }
  }
}
