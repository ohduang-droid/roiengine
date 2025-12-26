import { DeploymentPlan } from '@/lib/types';

// Mock deployment plans for different scenarios
export const mockDeploymentPlans: Record<string, DeploymentPlan> = {
  growth: {
    growth_allocation: 100,
    retention_allocation: 0,
    growth_n: 1800,
    retention_n: 0,
    growth_audience: "Free subscribers with high engagement (top 30% activity)",
    retention_audience: "",
    target_rule: "",
    timeline_latest_start_date: "Jan 15, 2026",

    new_paid: {
      low: 45,
      mid: 67,
      high: 89
    },
    billable_extra_cycles: {
      low: 0,
      mid: 0,
      high: 0
    },

    net_profit_uplift: {
      year1: { low: 12500, mid: 18750, high: 25000 },
      year2: { low: 31250, mid: 46875, high: 62500 },
      year3: { low: 56250, mid: 84375, high: 112500 }
    },
    payback_months: {
      low: 8,
      mid: 5,
      high: 4
    },
    roi_multiple: {
      low: 1.3,
      mid: 1.9,
      high: 2.5
    },

    confidence_level: 'medium',
    assumption_sources: ['FC benchmarks', 'Similar pilots'],

    experiments: {
      experiment_1: "A/B test: Free-only vs Mixed audience targeting",
      experiment_2: "Compare touch frequency: 3x vs 5x per week",
      metric_1: "New paid conversion rate",
      metric_2: "New paid conversion rate"
    },

    plan_type: 'growth',
    pilot_cost: 18000,
    magnets_to_deploy_M: 1800
  },

  retention: {
    growth_allocation: 0,
    retention_allocation: 100,
    growth_n: 0,
    retention_n: 1800,
    growth_audience: "",
    retention_audience: "Paid subscribers in months 2-4 (pre-dropoff risk window)",
    target_rule: "Risk score > 0.7 (high churn probability)",
    recommended_paid_risk_filters: "Paid subscribers with risk_score > 0.7 AND subscription_months BETWEEN 2 AND 4",
    selected_risks: ["high churn probability", "subscription length"],
    dropoff_peak_window: "M2-M4",
    timeline_latest_start_date: "Jan 10, 2026",

    new_paid: {
      low: 0,
      mid: 0,
      high: 0
    },
    billable_extra_cycles: {
      low: 1.2,
      mid: 1.8,
      high: 2.4
    },

    net_profit_uplift: {
      year1: { low: 15600, mid: 23400, high: 31200 },
      year2: { low: 39000, mid: 58500, high: 78000 },
      year3: { low: 70200, mid: 105300, high: 140400 }
    },
    payback_months: {
      low: 6,
      mid: 4,
      high: 3
    },
    roi_multiple: {
      low: 1.6,
      mid: 2.3,
      high: 3.1
    },

    confidence_level: 'high',
    assumption_sources: ['FC benchmarks', 'Global conservative baseline'],

    experiments: {
      experiment_1: "A/B test: Risk filter A vs Risk filter B",
      experiment_2: "Test optimal touch timing: Week 1 vs Week 2 of cycle",
      metric_1: "Retention evidence rate",
      metric_2: "Retention evidence rate"
    },

    plan_type: 'retention',
    pilot_cost: 18000,
    magnets_to_deploy_M: 1800
  },

  'growth_and_retention': {
    growth_allocation: 60,
    retention_allocation: 40,
    growth_n: 1080,
    retention_n: 720,
    primary_focus_label: "Maximize net profit",
    growth_audience: "Free subscribers with high engagement (top 25% activity)",
    retention_audience: "Paid subscribers in months 2-4 (pre-dropoff risk window)",
    target_rule: "Risk score > 0.6 (medium-high churn probability)",
    recommended_paid_risk_filters: "Paid subscribers with risk_score > 0.6 AND subscription_months BETWEEN 2 AND 4",
    selected_risks: ["medium-high churn probability", "subscription length"],
    dropoff_peak_window: "M2-M4",
    timeline_latest_start_date: "Jan 05, 2026",
    rollout_suggestion: "Roll out in 2 batches to compare targeting rules and converge faster.",

    new_paid: {
      low: 32,
      mid: 48,
      high: 64
    },
    billable_extra_cycles: {
      low: 0.8,
      mid: 1.2,
      high: 1.6
    },

    net_profit_uplift: {
      year1: { low: 20800, mid: 31200, high: 41600 },
      year2: { low: 52000, mid: 78000, high: 104000 },
      year3: { low: 93600, mid: 140400, high: 187200 }
    },
    payback_months: {
      low: 5,
      mid: 3,
      high: 2
    },
    roi_multiple: {
      low: 2.1,
      mid: 3.1,
      high: 4.1
    },

    confidence_level: 'medium',
    assumption_sources: ['FC benchmarks', 'Similar pilots'],

    experiments: {
      experiment_1: "Growth: Free-only vs Mixed audience split test",
      experiment_2: "Retention: Risk threshold optimization (0.6 vs 0.8)",
      metric_1: "New paid conversion rate",
      metric_2: "Retention evidence rate"
    },

    plan_type: 'growth_and_retention',
    pilot_cost: 18000,
    magnets_to_deploy_M: 1800
  }
};

// Helper function to get deployment plan by plan choice
export const getMockDeploymentPlan = (planChoice: string, magnetsM: number = 1800): DeploymentPlan => {
  const basePlan = mockDeploymentPlans[planChoice] || mockDeploymentPlans.growth;
  const costPerMagnet = 10;
  const pilotCost = magnetsM * costPerMagnet;

  return {
    ...basePlan,
    pilot_cost: pilotCost,
    magnets_to_deploy_M: magnetsM
  };
};

