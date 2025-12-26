// ROI Engine Types

export type PlanChoice = 'growth' | 'retention' | 'growth_and_retention';

export type PricingModel = 'monthly' | 'annual';

export type PrimaryFocus = 'maximize_new_paid' | 'maximize_net_profit' | 'stabilize_retention';

export type DropoffPeakWindow = 'M1' | 'M2' | 'M3' | 'M4' | 'M6' | 'M12';

export interface PilotFormData {
  // Section A: Pilot 规模
  magnets_to_deploy_M: number;

  // Section B: 目标选择
  plan_choice: PlanChoice;
  primary_focus?: PrimaryFocus;

  // Section C: 订阅与单位经济
  pricing_model: PricingModel;
  price_month_equiv_usd: number;
  free_subscribers_est: number;
  paid_subscribers_est: number;
  baseline_avg_paid_lifetime_months_L0: number;

  // Section D: 留存补充 (仅Plan B/Plan A+B显示)
  dropoff_peak_window?: DropoffPeakWindow;
  expected_extra_paid_months?: number;
}

export interface DeploymentPlan {
  // 推荐配比
  growth_allocation?: number;
  retention_allocation?: number;

  // 新增字段：分配的具体数量
  growth_n?: number;
  retention_n?: number;

  // 主焦点（仅A+B显示）
  primary_focus_label?: string;

  // 人群定义
  growth_audience?: string;
  retention_audience?: string;
  target_rule?: string;

  // 目标规则相关字段
  recommended_paid_risk_filters?: string;
  selected_risks?: string[];
  dropoff_peak_window?: string;

  // 时间线相关
  timeline_latest_start_date: string; // 格式：MMM DD, YYYY

  // 滚动建议（可选）
  rollout_suggestion?: string;

  // ROI区间
  new_paid?: {
    low: number;
    mid: number;
    high: number;
  };
  billable_extra_cycles?: {
    low: number;
    mid: number;
    high: number;
  };

  // 客户净收益ROI
  net_profit_uplift: {
    year1: { low: number; mid: number; high: number };
    year2: { low: number; mid: number; high: number };
    year3: { low: number; mid: number; high: number };
  };
  payback_months: {
    low: number;
    mid: number;
    high: number;
  };
  roi_multiple: {
    low: number;
    mid: number;
    high: number;
  };

  // 置信度与假设来源
  confidence_level: 'high' | 'medium' | 'low';
  assumption_sources: string[];

  // 下一步实验
  experiments: {
    experiment_1: string;
    experiment_2: string;
    metric_1: string;
    metric_2: string;
  };

  // 元数据
  plan_type: PlanChoice;
  pilot_cost: number;
  magnets_to_deploy_M: number;
}

