export interface RoiInputs {
  /** Total number of magnets to deploy (M_total) */
  totalMagnets: number
  /** Number of paid subscribers (for current state, and capping logic) */
  paidSubscribers: number
  /** Number of free subscribers (for current state, and capping logic) */
  freeSubscribers: number
  /** Average monthly revenue per paid subscriber (P) */
  arppuMonthlyUsd: number
  /** Average lifetime of a paid subscriber in months (L0) - Used to derive baseline churn c0 */
  avgLifetimeMonths: number
  /** Baseline Monthly Conversion Rate (p0_monthly) - percentage (e.g. 0.005 for 0.5%) */
  baselineMonthlyConversion?: number
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

  /** Conversion uplift factor (alpha) - e.g. 0.10 means 10% lift on base conversion p0 */
  conversionUpliftAlpha: number
  /** Churn reduction factor (beta) - e.g. 0.10 means 10% reduction on base churn c0 */
  churnReductionBeta: number

  /** Proportion of Paid Allocation for Plan B (default 0.4 i.e. 40%) */
  paidAllocationRate: number

  /** Decay time constant (tau) in months, default 24 */
  decayTau: number

  /** Default horizon for financial view in months (12) */
  horizonMonths: number

  /** Baseline Conversion Rate (p0) assumption if not provided */
  defaultBaselineConversion: number
}

export const DEFAULT_CONFIG: RoiConfig = {
  grossMargin: 0.8,
  fcShare: 0.10,
  costPerMagnetUsd: 10, // Updated to $10 per recent spec

  // Alpha: FC makes free users "easier to convert"
  // Mapping "conversionRateGrowth" (0.10) to alpha
  conversionUpliftAlpha: 0.5,

  // Beta: FC makes paid users "harder to churn"
  // Mapping "churnImprovement" (0.10) to beta
  churnReductionBeta: 0.25,

  // Plan B: 40% Paid, 60% Free
  paidAllocationRate: 0.40,

  // Decay Tau: 18-24 months recommended
  decayTau: 60,

  horizonMonths: 12,

  // Assumed baseline monthly conversion rate for free->paid (5%)
  defaultBaselineConversion: 0.05
}

export interface DailyCashflow {
  month: number
  growthProfit: number
  retentionProfit: number
  totalProfit: number
  cumulativeNetGain: number
}

export interface RoiResults {
  allocation: {
    free: number
    paid: number
  }
  growth: {
    magnetsFree: number
    newPaidUsers: number // Estimated cumulative over 12m
    revenue12m: number
    profit12m: number
    isProfitable: boolean // Just a flag based on 12m view
  }
  retention: {
    magnetsPaid: number
    profit12m: number
    // We keep these for UI compatibility, though they might be approximations now
    deltaL: number
    deltaLEffective: number
    extraUserMonths12m: number
  }
  total: {
    pilotCost: number
    netGain12m: number
    roi12m: number // multiplier (e.g. 1.5x)
    paybackMonths: number
  }
  // New: Raw monthly flows for analysis/charts if needed
  monthlyFlows?: DailyCashflow[]
}

/**
 * Calculates allocation based on:
 * - Plan A: 100% Free
 * - Plan B: Variable % Paid (Default 40% as per config)
 */
export function calculateAllocation(
  inputs: RoiInputs,
  config: RoiConfig = DEFAULT_CONFIG
): { free: number; paid: number } {
  const { totalMagnets, paidSubscribers, freeSubscribers } = inputs

  let mPaid = 0;
  if (inputs.planChoice === "growth_and_retention") {
    // Rule: Paid Ratio = config.paidAllocationRate (default 0.4)
    mPaid = Math.round(inputs.totalMagnets * config.paidAllocationRate)
  }

  // Guardrail: Cannot deploy more paid magnets than paid subscribers
  if (mPaid > paidSubscribers) {
    mPaid = paidSubscribers
  }

  let mFree = totalMagnets - mPaid

  // Guardrail: Cannot deploy more free magnets than free subscribers
  if (mFree > freeSubscribers) {
    mFree = freeSubscribers
    // Note: If constrained by Free subs, we don't automatically shift to Paid to avoid violating the Ratio intent.
    // We just deploy fewer total if the pools are tiny.
  }

  return { free: mFree, paid: mPaid }
}

/**
 * Recommends pilot size based on Monthly Revenue (MRR).
 * Logic:
 * MRR = PaidSubscribers * ARPPU
 * RawMagnets = (MRR * 10%) / 10
 * TotalMagnets = clamp(RawMagnets, 1500, 3000)
 */
export function recommendPilotSize(inputs: RoiInputs): number {
  const mrr = inputs.paidSubscribers * inputs.arppuMonthlyUsd
  // Pilot Budget = 10% of MRR
  // Cost per magnet = $10 (Hardcoded in logic formulation, but effectively DEFAULT_CONFIG.costPerMagnetUsd)
  // We use 10 in divisor as per spec.
  const rawMagnets = (mrr * 0.10) / 10

  // Clamp between 1500 and 3000
  return Math.min(Math.max(Math.round(rawMagnets), 1500), 3000)
}

/**
 * Core Calculation Engine: Monthly Cashflow Model
 */
export function calculateRoi(inputs: RoiInputs, config: RoiConfig = DEFAULT_CONFIG): RoiResults {
  const {
    grossMargin,
    fcShare,
    costPerMagnetUsd,
    conversionUpliftAlpha,
    churnReductionBeta,
    decayTau,
    horizonMonths,
    defaultBaselineConversion
  } = config

  const { arppuMonthlyUsd, avgLifetimeMonths } = inputs

  // 1. Allocation
  const allocation = calculateAllocation(inputs, config)
  const M_free = allocation.free
  const M_paid = allocation.paid
  const pilotCost = (M_free + M_paid) * costPerMagnetUsd

  // 2. Baselines
  // c0: Baseline Churn = 1 / L0
  const c0 = avgLifetimeMonths > 0 ? 1 / avgLifetimeMonths : 0.15 // fallback
  // p0: Baseline Conversion. If not provided, assume default.
  const p0 = inputs.baselineMonthlyConversion !== undefined
    ? inputs.baselineMonthlyConversion
    : defaultBaselineConversion

  // 3. Loop Constants
  // K: Net profit per paid-user-month for creator = P * (1 - share) * GM
  // NOTE: This assumes the Share (10%) is on Revenue.
  // OR GrossMargin applies first? 
  // Usually: NetRevenue = Revenue * (1 - Share). GrossProfit = NetRevenue * Margin.
  // Let's assume standard: (ARPU * (1-share)) * GM
  const K = arppuMonthlyUsd * (1 - fcShare) * grossMargin

  // Simulation Loop
  // We run for 24 months to capture payback that might happen in Year 2
  const SIMULATION_MONTHS = 60
  const flows: DailyCashflow[] = []

  let cumulativeNetGain = -pilotCost
  let paybackMonth = 0
  let foundPayback = false

  // Trackers for Summary
  let sumGrowthProfit12m = 0
  let sumRetentionProfit12m = 0
  let sumNewPaidUsers12m = 0 // Approximate
  let sumExtraMonths12m = 0  // Approximate

  // Cohort tracking for Retention (Simplified)
  // We model the "Alive" count of the original magnet cohort vs a baseline cohort.
  // Baseline Alive(t) = M_paid * (1 - c0)^t
  // Pilot Alive(t)    = M_paid * product(1 - c(i)) for i=1..t

  // Pre-calculate cumulative survival probability for Pilot
  let pilotSurvivalProb = 1.0
  let baselineSurvivalProb = 1.0

  for (let t = 1; t <= SIMULATION_MONTHS; t++) {
    // --- Decay Function D(t) ---
    const D_t = Math.exp(-t / decayTau)

    // --- TRACK A: GROWTH (Cashflow) ---
    // p(t) = p0 * (1 + alpha * D(t))
    // Delta Paid(t) = FreeCovered * (p(t) - p0)
    // GP_B(t) = Delta Paid(t) * K (Assuming immediate profit recognition for simplicity or simple LTV view?)
    // Spec says: GP_B(t) = Delta Paid_B(t) * ARPU * Margin. (Wait, strictly ARPU*Margin or K?)
    // "GP_B(t) = Delta Paid_B(t) * ARPU_month * Gross_margin" -> The formula in doc MISSES the FC Share deducation?
    // Section 11 says "Growth pays back deployment". Ideally we should use the Creator's Net K. 
    // I will use K (which includes FC share deduction) to be conservative and accurate for CREATOR ROI.

    // Impact on conversion rate
    const p_t = p0 * (1 + conversionUpliftAlpha * D_t)
    const delta_p = p_t - p0 // = p0 * alpha * D_t

    // New Paid Users (Incremental) in Month t
    // Note: This assumes Free pool is constant? Or depleting?
    // Framework implies "Free_covered(t)" but usually we treat M_free as the constant pool being targeted.
    const deltaPaid_t = M_free * delta_p

    const gpGrowth_t = deltaPaid_t * K

    if (t <= horizonMonths) {
      sumGrowthProfit12m += gpGrowth_t
      sumNewPaidUsers12m += deltaPaid_t
    }

    // --- TRACK B: RETENTION (Cashflow) ---
    // c(t) = c0 * (1 - beta * D(t))
    // Delta Alive(t) = M_paid * [ (1-c(t))^t - (1-c0)^t ] ... Wait, the formula was product based vs power based.
    // If c(t) changes every month, we must accumulate survival.

    // Update Baseline Survival: (1 - c0)^t
    baselineSurvivalProb *= (1 - c0)

    // Update Pilot Survival: product(1 - c(i))
    const c_t = c0 * (1 - churnReductionBeta * D_t)
    pilotSurvivalProb *= (1 - c_t)

    // Delta Alive
    const deltaAliveProb = Math.max(0, pilotSurvivalProb - baselineSurvivalProb)
    const deltaAlive_t = M_paid * deltaAliveProb

    const gpRetention_t = deltaAlive_t * K

    if (t <= horizonMonths) {
      sumRetentionProfit12m += gpRetention_t
      sumExtraMonths12m += deltaAlive_t // Summing "extra user-months"
    }

    // --- TOTAL ---
    const totalProfit_t = gpGrowth_t + gpRetention_t
    cumulativeNetGain += totalProfit_t

    flows.push({
      month: t,
      growthProfit: gpGrowth_t,
      retentionProfit: gpRetention_t,
      totalProfit: totalProfit_t,
      cumulativeNetGain
    })

    if (!foundPayback && cumulativeNetGain >= 0) {
      paybackMonth = t
      foundPayback = true
    }
  }

  const totalProfit12m = sumGrowthProfit12m + sumRetentionProfit12m
  const netGain12m = totalProfit12m - pilotCost
  const roi12m = pilotCost > 0 ? (netGain12m / pilotCost) : 0

  // Backwards compatibility approximations for UI
  // Delta L roughly = sum(extraMonths) / M_paid?
  const safePaid = M_paid || 1
  const approximateDeltaLEffective = sumExtraMonths12m / safePaid

  return {
    allocation,
    growth: {
      magnetsFree: M_free,
      newPaidUsers: Math.round(sumNewPaidUsers12m * 10) / 10,
      revenue12m: 0, // Not explicitly tracking Gross Revenue in new model loop, but could approximations
      profit12m: sumGrowthProfit12m,
      isProfitable: sumGrowthProfit12m >= pilotCost // Simple check
    },
    retention: {
      magnetsPaid: M_paid,
      profit12m: sumRetentionProfit12m,
      deltaL: 0, // deprecated/complex
      deltaLEffective: approximateDeltaLEffective,
      extraUserMonths12m: Math.round(sumExtraMonths12m)
    },
    total: {
      pilotCost,
      netGain12m,
      roi12m,
      paybackMonths: paybackMonth
    },
    monthlyFlows: flows
  }
}

