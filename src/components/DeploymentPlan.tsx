'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Tooltip,
  Collapse,
  message,
  Steps,
  Alert,
  Divider
} from 'antd';
import {
  CopyOutlined,
  MailOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { DeploymentPlan as DeploymentPlanType, PilotFormData } from '@/lib/types';
import { getMockDeploymentPlan } from '@/mock/deployment-plans';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const DeploymentPlan: React.FC = () => {
  const router = useRouter();
  const [isClient] = useState(true);

  // 从localStorage获取表单数据
  const formData = useMemo(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('pilotFormData');
      return data ? JSON.parse(data) as PilotFormData : null;
    }
    return null;
  }, []);

  // 根据表单数据生成部署计划
  const planData = useMemo(() => {
    if (formData) {
      return getMockDeploymentPlan(formData.plan_choice, formData.magnets_to_deploy_M);
    }
    return null;
  }, [formData]);

  useEffect(() => {
    if (!formData && typeof window !== 'undefined') {
      // 如果没有表单数据，重定向回首页
      router.push('/');
    }
  }, [formData, router]);

  const handleCopyPlan = () => {
    if (!planData || !formData) return;

    const planText = generatePlanText(planData, formData);
    navigator.clipboard.writeText(planText).then(() => {
      message.success('Plan copied to clipboard!');
    });
  };

  const generatePlanText = (plan: DeploymentPlanType, form: PilotFormData): string => {
    let text = `FC Pilot Deployment Plan — ${form.plan_choice === 'growth' ? 'Growth' : form.plan_choice === 'retention' ? 'Retention' : 'Growth + Retention'} — M=${form.magnets_to_deploy_M}

Pilot Cost: $${plan.pilot_cost.toLocaleString()}

RECOMMENDED ALLOCATION:
`;

    if (plan.growth_allocation && plan.growth_allocation > 0) {
      text += `Growth: ${plan.growth_allocation}%\n`;
    }
    if (plan.retention_allocation && plan.retention_allocation > 0) {
      text += `Retention: ${plan.retention_allocation}%\n`;
    }

    text += `
AUDIENCE DEFINITION:
`;
    if (plan.growth_audience) {
      text += `Growth Audience: ${plan.growth_audience}\n`;
    }
    if (plan.retention_audience) {
      text += `Retention Audience: ${plan.retention_audience}\n`;
    }
    if (plan.target_rule) {
      text += `Target Rule: ${plan.target_rule}\n`;
    }

    text += `
ROI SCENARIOS:
New Paid: Low ${plan.new_paid?.low || 0} | Mid ${plan.new_paid?.mid || 0} | High ${plan.new_paid?.high || 0}
Billable Extra Cycles: Low ${plan.billable_extra_cycles?.low || 0} | Mid ${plan.billable_extra_cycles?.mid || 0} | High ${plan.billable_extra_cycles?.high || 0}

CUSTOMER NET ROI:
Year 1: Low $${plan.net_profit_uplift.year1.low.toLocaleString()} | Mid $${plan.net_profit_uplift.year1.mid.toLocaleString()} | High $${plan.net_profit_uplift.year1.high.toLocaleString()}
Year 2 (cumulative): Low $${plan.net_profit_uplift.year2.low.toLocaleString()} | Mid $${plan.net_profit_uplift.year2.mid.toLocaleString()} | High $${plan.net_profit_uplift.year2.high.toLocaleString()}
Year 3 (cumulative): Low $${plan.net_profit_uplift.year3.low.toLocaleString()} | Mid $${plan.net_profit_uplift.year3.mid.toLocaleString()} | High $${plan.net_profit_uplift.year3.high.toLocaleString()}

Payback: Low ${plan.payback_months.low} months | Mid ${plan.payback_months.mid} months | High ${plan.payback_months.high} months
ROI Multiple: Low ${plan.roi_multiple.low}x | Mid ${plan.roi_multiple.mid}x | High ${plan.roi_multiple.high}x

CONFIDENCE & ASSUMPTIONS:
Confidence: ${plan.confidence_level.charAt(0).toUpperCase() + plan.confidence_level.slice(1)}
Assumptions: ${plan.assumption_sources.join(', ')}

NEXT EXPERIMENTS:
1. ${plan.experiments.experiment_1} (Success metric: ${plan.experiments.metric_1})
2. ${plan.experiments.experiment_2} (Success metric: ${plan.experiments.metric_2})

No evidence, no bill.`;

    return text;
  };

  const handleEmailToMe = () => {
    if (!planData || !formData) return;

    const subject = `FC Pilot Deployment Plan — ${formData.plan_choice === 'growth' ? 'Growth' : formData.plan_choice === 'retention' ? 'Retention' : 'Growth + Retention'} — M=${formData.magnets_to_deploy_M}`;
    const body = generatePlanText(planData, formData);
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(mailtoLink);
  };

  const handleEmailToTeam = () => {
    if (!planData || !formData) return;

    const subject = `FC Pilot Deployment Plan — ${formData.plan_choice === 'growth' ? 'Growth' : formData.plan_choice === 'retention' ? 'Retention' : 'Growth + Retention'} — M=${formData.magnets_to_deploy_M}`;
    const body = generatePlanText(planData, formData);
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(mailtoLink);
  };

  const handleExportPDF = () => {
    message.info('PDF export feature coming soon!');
  };

  const handleCopyRule = (rule: string) => {
    navigator.clipboard.writeText(rule).then(() => {
      message.success('Rule copied to clipboard!');
    });
  };

  if (!isClient || !planData || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Loading deployment plan...</Text>
        </div>
      </div>
    );
  }

  const getPlanBadgeText = (planChoice: string) => {
    switch (planChoice) {
      case 'growth': return 'Growth';
      case 'retention': return 'Retention';
      case 'growth_and_retention': return 'Growth + Retention';
      default: return 'Growth';
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'green';
      case 'medium': return 'orange';
      case 'low': return 'red';
      default: return 'default';
    }
  };

  const getConfidenceTooltip = (level: string) => {
    switch (level) {
      case 'high': return 'Inputs are specific and match strong benchmark coverage.';
      case 'medium': return 'Some inputs are estimated; benchmarks are moderately matched.';
      case 'low': return 'Key inputs are unknown; we used conservative global benchmarks.';
      default: return '';
    }
  };

  const timelineSteps = [
    { title: 'Kickoff & targeting', duration: '2–3 days', description: 'Confirm target pools and list criteria.' },
    { title: 'Design final', duration: '2–4 days', description: 'Finalize the magnet creative.' },
    { title: 'Sampling', duration: '5–7 days', description: 'Approve sample before production.' },
    { title: 'Production', duration: '10–14 days', description: 'Manufacture the pilot batch.' },
    { title: 'Shipping', duration: '7–12 days', description: 'Delivery to target audience.' },
    { title: 'Rollout', duration: '7–10 days', description: 'Staggered delivery for measurement.' },
    { title: 'First review', duration: '14 days after rollout starts', description: 'Review evidence + invoice-aligned outcomes.' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* A) 顶部摘要条 (Sticky Summary Bar) */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Text className="text-gray-600 font-medium">Plan</Text>
                <Tag color="blue" className="font-medium">
                  {getPlanBadgeText(formData.plan_choice)}
                </Tag>
              </div>

              <Tooltip title="Pilot only supports 1,500–2,999 touchpoints.">
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-gray-500" />
                  <Text className="text-gray-600 font-medium">Touchpoints (M)</Text>
                  <Text className="text-lg font-semibold">{planData.magnets_to_deploy_M.toLocaleString()}</Text>
                </div>
              </Tooltip>

              <Tooltip title="Pilot cost is fixed at $10 per touchpoint user.">
                <div className="flex items-center gap-2">
                  <DollarOutlined className="text-gray-500" />
                  <Text className="text-gray-600 font-medium">Pilot cost</Text>
                  <Text className="text-lg font-semibold">${planData.pilot_cost.toLocaleString()}</Text>
                  <Text className="text-sm text-gray-500">$10 × {planData.magnets_to_deploy_M.toLocaleString()}</Text>
                </div>
              </Tooltip>

              <Tooltip title="Start by this date to hit the recommended rollout window.">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-gray-500" />
                  <Text className="text-gray-600 font-medium">Latest start date</Text>
                  <Text className="text-lg font-semibold">{planData.timeline_latest_start_date}</Text>
                </div>
              </Tooltip>

              <Tooltip title="Payback is shown using the Mid scenario.">
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-gray-500" />
                  <Text className="text-gray-600 font-medium">Payback (Mid)</Text>
                  <Text className="text-lg font-semibold text-green-600">{planData.payback_months.mid} months</Text>
                </div>
              </Tooltip>
            </div>

            <div className="flex items-center gap-3">
              <Space>
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={handleCopyPlan}
                  size="large"
                >
                  Copy plan
                </Button>
                <Button
                  icon={<MailOutlined />}
                  onClick={handleEmailToMe}
                  size="large"
                >
                  Email to me
                </Button>
                <Button
                  icon={<MailOutlined />}
                  onClick={handleEmailToTeam}
                  size="large"
                >
                  Email to team
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportPDF}
                  disabled
                  size="large"
                >
                  Export PDF
                </Button>
              </Space>
              <Text className="text-gray-500 text-sm ml-2">Copy-ready format for proposals.</Text>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Block 2: Pilot scope & cost */}
          <Card className="shadow-lg">
            <Title level={3} className="mb-6">Pilot scope & cost</Title>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-2">
                  <Text className="text-gray-600 font-medium">Touchpoints (M)</Text>
                </div>
                <div className="flex items-center gap-3">
                  <Text className="text-2xl font-bold">{planData.magnets_to_deploy_M.toLocaleString()}</Text>
                  <Text className="text-gray-500">Pilot range: 1,500–2,999</Text>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <Text className="text-gray-600 font-medium">Pilot cost</Text>
                </div>
                <div className="flex items-center gap-3">
                  <Text className="text-2xl font-bold">${planData.pilot_cost.toLocaleString()}</Text>
                  <Text className="text-gray-500">$10 × {planData.magnets_to_deploy_M.toLocaleString()}</Text>
                </div>
              </div>
            </div>

            <Divider />

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <InfoCircleOutlined className="text-blue-500 mt-1" />
                <div>
                  <Text className="font-medium text-blue-900 mb-1">Scaling</Text>
                  <Text className="text-blue-800">
                    ROI Engine currently generates Pilot plans only. For M ≥ 3,000, contact us for a standard rollout plan.{' '}
                    <Button type="link" className="p-0 h-auto text-blue-600 font-medium">
                      Contact us
                    </Button>
                  </Text>
                </div>
              </div>
            </div>

            <div className="mt-4 text-gray-500 text-sm">
              Note: Costs shown here exclude any optional design add-ons (if applicable).
            </div>
          </Card>

          {/* Block 3: Who gets magnets */}
          <Card className="shadow-lg">
            <Title level={3} className="mb-6">Who gets magnets</Title>

            {/* Allocation Section */}
            <div className="mb-8">
              <Title level={4} className="mb-4">Allocation</Title>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {planData.growth_allocation && planData.growth_allocation > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Tooltip title="Growth magnets are aimed at converting non-paying users into paid subscribers.">
                      <div className="flex items-center gap-2 mb-2">
                        <Text className="font-medium text-green-900">Growth allocation</Text>
                        <InfoCircleOutlined className="text-green-600" />
                      </div>
                    </Tooltip>
                    <div className="text-2xl font-bold text-green-600">{planData.growth_allocation}%</div>
                    <div className="text-sm text-green-700">({planData.growth_n?.toLocaleString()} magnets)</div>
                  </div>
                )}

                {planData.retention_allocation && planData.retention_allocation > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Tooltip title="Retention magnets are aimed at improving ongoing value perception for paid users.">
                      <div className="flex items-center gap-2 mb-2">
                        <Text className="font-medium text-blue-900">Retention allocation</Text>
                        <InfoCircleOutlined className="text-blue-600" />
                      </div>
                    </Tooltip>
                    <div className="text-2xl font-bold text-blue-600">{planData.retention_allocation}%</div>
                    <div className="text-sm text-blue-700">({planData.retention_n?.toLocaleString()} magnets)</div>
                  </div>
                )}

                {planData.primary_focus_label && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="mb-2">
                      <Text className="font-medium text-purple-900">Focus</Text>
                    </div>
                    <div className="text-lg font-semibold text-purple-600">{planData.primary_focus_label}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Audience Definition Section */}
            <div className="mb-8">
              <Title level={4} className="mb-4">Audience definition</Title>
              <div className="space-y-4">
                {planData.growth_audience && (
                  <div>
                    <Text className="font-medium text-gray-900 mb-2 block">Growth audience</Text>
                    <Tooltip title="You don't need to decide the mix — we recommend it based on benchmarks and your inputs.">
                      <Text className="text-gray-700">{planData.growth_audience}</Text>
                    </Tooltip>
                  </div>
                )}

                {planData.retention_audience && (
                  <div>
                    <Text className="font-medium text-gray-900 mb-2 block">Retention audience</Text>
                    <Tooltip title="We use your selected risk signals + drop-off window to generate a practical targeting rule.">
                      <Text className="text-gray-700">{planData.retention_audience}</Text>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>

            {/* Targeting Rule Section */}
            {planData.recommended_paid_risk_filters && (
              <div>
                <Title level={4} className="mb-4">Targeting rule (copy-ready)</Title>
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Text className="text-sm text-gray-600 mb-1">Rule:</Text>
                      <Text className="font-mono text-gray-900">{planData.recommended_paid_risk_filters}</Text>
                    </div>
                    <Button
                      icon={<CopyOutlined />}
                      size="small"
                      onClick={() => handleCopyRule(planData.recommended_paid_risk_filters || '')}
                    >
                      Copy rule
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Built from: {planData.selected_risks?.join(' + ')} + {planData.dropoff_peak_window}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Block 4: Timeline */}
          <Card className="shadow-lg">
            <Title level={3} className="mb-6">Timeline</Title>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <ClockCircleOutlined className="text-gray-500" />
                <Text className="font-medium text-gray-900">Latest start date</Text>
                <Tooltip title="Starting later may miss the optimal rollout window and reduce expected ROI.">
                  <InfoCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
              <Text className="text-xl font-bold">{planData.timeline_latest_start_date}</Text>
            </div>

            <div className="mb-4">
              <Text className="font-medium text-gray-900 mb-4 block">Steps</Text>
              <Steps
                direction="vertical"
                size="small"
                current={-1}
                items={timelineSteps.map((step, index) => ({
                  key: index,
                  title: <Text className="font-medium">{step.title}</Text>,
                  description: (
                    <div>
                      <Text className="text-blue-600 font-medium">{step.duration}</Text>
                      <br />
                      <Text className="text-gray-600">{step.description}</Text>
                    </div>
                  )
                }))}
              />
            </div>

            {planData.rollout_suggestion && (
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <Text className="font-medium text-yellow-900 mb-1 block">Rollout suggestion</Text>
                <Text className="text-yellow-800">{planData.rollout_suggestion}</Text>
              </div>
            )}
          </Card>

          {/* Block 5: Expected impact & ROI */}
          <Card className="shadow-lg">
            <Title level={3} className="mb-6">Expected impact & ROI</Title>

            {/* Impact metrics */}
            <div className="mb-8">
              <Title level={4} className="mb-4">Impact metrics</Title>

              <div className="space-y-6">
                {planData.new_paid && planData.new_paid.mid > 0 && (
                  <div>
                    <Text className="font-medium text-gray-900 mb-3 block">New Paid (first 60–90 days)</Text>
                    <Tooltip title="Estimated using FC benchmarks; actual billed Growth requires touch evidence + later payment.">
                      <div className="flex gap-4">
                        <div className="flex-1 bg-red-50 p-4 rounded-lg text-center">
                          <Text className="text-sm text-red-700 mb-1">Low</Text>
                          <Text className="text-xl font-bold text-red-600">~{planData.new_paid.low}</Text>
                        </div>
                        <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center border-2 border-gray-300">
                          <Text className="text-sm text-gray-700 mb-1">Mid</Text>
                          <Text className="text-xl font-bold text-gray-900">~{planData.new_paid.mid}</Text>
                        </div>
                        <div className="flex-1 bg-green-50 p-4 rounded-lg text-center">
                          <Text className="text-sm text-green-700 mb-1">High</Text>
                          <Text className="text-xl font-bold text-green-600">~{planData.new_paid.high}</Text>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                )}

                {planData.billable_extra_cycles && planData.billable_extra_cycles.mid > 0 && (
                  <div>
                    <Text className="font-medium text-gray-900 mb-3 block">Billable extra cycles (Cycle 11+)</Text>
                    <Tooltip title="Cycles are month-equivalent. Annual plans are converted into monthly-equivalent cycles.">
                      <div className="flex gap-4">
                        <div className="flex-1 bg-red-50 p-4 rounded-lg text-center">
                          <Text className="text-sm text-red-700 mb-1">Low</Text>
                          <Text className="text-xl font-bold text-red-600">~{planData.billable_extra_cycles.low}</Text>
                        </div>
                        <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center border-2 border-gray-300">
                          <Text className="text-sm text-gray-700 mb-1">Mid</Text>
                          <Text className="text-xl font-bold text-gray-900">~{planData.billable_extra_cycles.mid}</Text>
                        </div>
                        <div className="flex-1 bg-green-50 p-4 rounded-lg text-center">
                          <Text className="text-sm text-green-700 mb-1">High</Text>
                          <Text className="text-xl font-bold text-green-600">~{planData.billable_extra_cycles.high}</Text>
                        </div>
                      </div>
                    </Tooltip>
                    <div className="mt-2 text-sm text-gray-600">
                      Why Cycle 11+? Retention is billed only after Cycle 10, so we count only what can be billed.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer net ROI */}
            <div className="mb-8">
              <Title level={4} className="mb-4">Customer net profit uplift</Title>

              <div className="space-y-4">
                <div>
                  <Text className="font-medium text-gray-900 mb-3 block">Year 1</Text>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-red-50 p-4 rounded-lg text-center">
                      <Text className="text-sm text-red-700 mb-1">Low</Text>
                      <Text className="text-xl font-bold text-red-600">${planData.net_profit_uplift.year1.low.toLocaleString()}</Text>
                    </div>
                    <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center border-2 border-gray-300">
                      <Text className="text-sm text-gray-700 mb-1">Mid</Text>
                      <Text className="text-xl font-bold text-gray-900">${planData.net_profit_uplift.year1.mid.toLocaleString()}</Text>
                    </div>
                    <div className="flex-1 bg-green-50 p-4 rounded-lg text-center">
                      <Text className="text-sm text-green-700 mb-1">High</Text>
                      <Text className="text-xl font-bold text-green-600">${planData.net_profit_uplift.year1.high.toLocaleString()}</Text>
                    </div>
                  </div>
                </div>

                <div>
                  <Text className="font-medium text-gray-900 mb-3 block">Year 2 (cumulative)</Text>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-red-50 p-4 rounded-lg text-center">
                      <Text className="text-sm text-red-700 mb-1">Low</Text>
                      <Text className="text-xl font-bold text-red-600">${planData.net_profit_uplift.year2.low.toLocaleString()}</Text>
                    </div>
                    <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center border-2 border-gray-300">
                      <Text className="text-sm text-gray-700 mb-1">Mid</Text>
                      <Text className="text-xl font-bold text-gray-900">${planData.net_profit_uplift.year2.mid.toLocaleString()}</Text>
                    </div>
                    <div className="flex-1 bg-green-50 p-4 rounded-lg text-center">
                      <Text className="text-sm text-green-700 mb-1">High</Text>
                      <Text className="text-xl font-bold text-green-600">${planData.net_profit_uplift.year2.high.toLocaleString()}</Text>
                    </div>
                  </div>
                </div>

                <div>
                  <Text className="font-medium text-gray-900 mb-3 block">Year 3 (cumulative)</Text>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-red-50 p-4 rounded-lg text-center">
                      <Text className="text-sm text-red-700 mb-1">Low</Text>
                      <Text className="text-xl font-bold text-red-600">${planData.net_profit_uplift.year3.low.toLocaleString()}</Text>
                    </div>
                    <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center border-2 border-gray-300">
                      <Text className="text-sm text-gray-700 mb-1">Mid</Text>
                      <Text className="text-xl font-bold text-gray-900">${planData.net_profit_uplift.year3.mid.toLocaleString()}</Text>
                    </div>
                    <div className="flex-1 bg-green-50 p-4 rounded-lg text-center">
                      <Text className="text-sm text-green-700 mb-1">High</Text>
                      <Text className="text-xl font-bold text-green-600">${planData.net_profit_uplift.year3.high.toLocaleString()}</Text>
                    </div>
                  </div>
                </div>
              </div>

              <Tooltip title="Net profit uplift = (incremental revenue after 10% share) × gross margin − pilot cost.">
                <InfoCircleOutlined className="text-gray-400 ml-2" />
              </Tooltip>
            </div>

            {/* Payback months */}
            <div className="mb-6">
              <Text className="font-medium text-gray-900 mb-3 block">Payback</Text>
              <div className="flex gap-4">
                <div className="flex-1 bg-red-50 p-4 rounded-lg text-center">
                  <Text className="text-sm text-red-700 mb-1">Low</Text>
                  <Text className="text-xl font-bold text-red-600">{planData.payback_months.low} months</Text>
                </div>
                <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center border-2 border-gray-300">
                  <Text className="text-sm text-gray-700 mb-1">Mid</Text>
                  <Text className="text-xl font-bold text-gray-900">{planData.payback_months.mid} months</Text>
                </div>
                <div className="flex-1 bg-green-50 p-4 rounded-lg text-center">
                  <Text className="text-sm text-green-700 mb-1">High</Text>
                  <Text className="text-xl font-bold text-green-600">{planData.payback_months.high} months</Text>
                </div>
              </div>
              <Tooltip title="Payback is pilot_cost / monthly net profit uplift (scenario-based).">
                <InfoCircleOutlined className="text-gray-400 ml-2 mt-1" />
              </Tooltip>
            </div>

            {/* ROI multiple */}
            <div className="mb-8">
              <Text className="font-medium text-gray-900 mb-3 block">ROI multiple</Text>
              <div className="flex gap-4">
                <div className="flex-1 bg-red-50 p-4 rounded-lg text-center">
                  <Text className="text-sm text-red-700 mb-1">Low</Text>
                  <Text className="text-xl font-bold text-red-600">{planData.roi_multiple.low}x</Text>
                </div>
                <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center border-2 border-gray-300">
                  <Text className="text-sm text-gray-700 mb-1">Mid</Text>
                  <Text className="text-xl font-bold text-gray-900">{planData.roi_multiple.mid}x</Text>
                </div>
                <div className="flex-1 bg-green-50 p-4 rounded-lg text-center">
                  <Text className="text-sm text-green-700 mb-1">High</Text>
                  <Text className="text-xl font-bold text-green-600">{planData.roi_multiple.high}x</Text>
                </div>
              </div>
              <Tooltip title="ROI multiple = net profit uplift / pilot cost.">
                <InfoCircleOutlined className="text-gray-400 ml-2 mt-1" />
              </Tooltip>
            </div>

            {/* Confidence & assumptions */}
            <div>
              <Title level={4} className="mb-4">Confidence & assumptions</Title>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <Text className="font-medium text-gray-900 mb-2 block">Confidence</Text>
                  <Tooltip title={getConfidenceTooltip(planData.confidence_level)}>
                    <Tag color={getConfidenceColor(planData.confidence_level)} className="text-base px-3 py-1">
                      {planData.confidence_level.charAt(0).toUpperCase() + planData.confidence_level.slice(1)}
                    </Tag>
                  </Tooltip>
                </div>

                <div>
                  <Tooltip title="We show where each scenario's assumptions come from to avoid false precision.">
                    <div>
                      <Text className="font-medium text-gray-900 mb-2 block">Assumptions</Text>
                      <div className="flex flex-wrap gap-2">
                        {planData.assumption_sources.map((source, index) => (
                          <Tag key={index} className="bg-gray-100 text-gray-700">{source}</Tag>
                        ))}
                      </div>
                    </div>
                  </Tooltip>
                </div>
              </div>

              <Collapse ghost>
                <Panel header="See details" key="1">
                  <Alert
                    message="We don't ask you for scans / usage / conversion funnels. Scenarios are generated from FC benchmark distributions and your top-level inputs."
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                  <div>
                    <Text className="font-medium mb-2 block">Scenario meaning:</Text>
                    <ul className="ml-4 space-y-1">
                      <li><Text className="text-red-600">Low = conservative percentile</Text></li>
                      <li><Text className="text-gray-900 font-medium">Mid = median percentile</Text></li>
                      <li><Text className="text-green-600">High = optimistic percentile</Text></li>
                    </ul>
                  </div>
                </Panel>
              </Collapse>
            </div>
          </Card>

          {/* Block 6: Next 2 experiments */}
          <Card className="shadow-lg">
            <Title level={3} className="mb-6">Next 2 experiments (to converge ROI)</Title>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <Title level={5} className="mb-2">Experiment 1</Title>
                    <Text className="text-gray-700 mb-2 block">{planData.experiments.experiment_1}</Text>
                    <Text className="text-sm text-gray-500">Success metric: {planData.experiments.metric_1}</Text>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <Title level={5} className="mb-2">Experiment 2</Title>
                    <Text className="text-gray-700 mb-2 block">{planData.experiments.experiment_2}</Text>
                    <Text className="text-sm text-gray-500">Success metric: {planData.experiments.metric_2}</Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer Notes */}
          <div className="text-center text-gray-500 text-sm space-y-1 pt-4">
            <p>No evidence, no bill.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentPlan;
