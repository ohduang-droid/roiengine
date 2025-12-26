'use client';

import React, { useState, useMemo } from 'react';
import {
  Form,
  Select,
  Button,
  InputNumber,
  Alert,
  Divider,
  Typography,
  Radio,
  Space
} from 'antd';
import { InfoCircleOutlined, DollarOutlined, CalculatorOutlined } from '@ant-design/icons';
import { PilotFormData, PlanChoice, PricingModel } from '@/lib/types';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PilotCalculatorProps {
  // Component props interface - currently empty as component is self-contained
}

const PilotCalculator: React.FC<PilotCalculatorProps> = () => {
  const [form] = Form.useForm<PilotFormData>();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanChoice>('growth');
  const [pricingModel, setPricingModel] = useState<PricingModel>('monthly');

  // 计算pilot成本
  const magnetsM = Form.useWatch('magnets_to_deploy_M', form);
  const pilotCost = useMemo(() => {
    if (magnetsM && magnetsM >= 1500 && magnetsM <= 2999) {
      return magnetsM * 10;
    }
    return 0;
  }, [magnetsM]);

  const handlePlanChange = (value: PlanChoice) => {
    setSelectedPlan(value);
    if (value !== 'growth_and_retention') {
      form.setFieldsValue({ primary_focus: undefined });
    }
  };

  const handlePricingModelChange = (value: PricingModel) => {
    setPricingModel(value);
  };

  const onFinish = (values: PilotFormData) => {
    // 将表单数据存储到localStorage或URL参数中，以便传递到结果页面
    localStorage.setItem('pilotFormData', JSON.stringify(values));
    router.push('/deployment-plan');
  };

  const validateMagnets = (_rule: unknown, value: number) => {
    if (!value) {
      return Promise.reject('请输入投放触点数量');
    }
    if (value < 1500) {
      return Promise.reject('Pilot最低1500个触点。想小规模试跑？请联系我们讨论更合适的方式。');
    }
    if (value >= 3000) {
      return Promise.reject('ROI Engine目前只生成Pilot方案（1500-2999）。如果你希望规模≥3000，请点击"Contact us"获取标准合作方案。');
    }
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Title level={1} className="text-3xl font-bold text-gray-900 mb-2">
            Pilot ROI Engine
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-3xl mx-auto">
            输入几个基础数字，我们会生成一份可执行投放方案 + 可对账的 ROI 区间（Low / Mid / High）。
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  pricing_model: 'monthly' as PricingModel,
                  plan_choice: 'growth' as PlanChoice
                }}
                size="large"
              >
                {/* Section A: Pilot 规模 */}
                <div className="mb-8">
                  <Title level={3} className="mb-4">1. Pilot 规模</Title>
                  <Form.Item
                    name="magnets_to_deploy_M"
                    label="你计划投放多少个触点（M）？"
                    rules={[{ validator: validateMagnets }]}
                    tooltip="Pilot只支持1500-2999。我们用这个规模来估算成本和ROI。"
                  >
                    <InputNumber
                      min={1}
                      max={5000}
                      placeholder="例如：1800"
                      className="w-full"
                      size="large"
                    />
                  </Form.Item>
                </div>

                <Divider />

                {/* Section B: 目标选择 */}
                <div className="mb-8">
                  <Title level={3} className="mb-4">2. 你的目标</Title>
                  <Form.Item
                    name="plan_choice"
                    label="你希望这次试点主要达成什么？"
                    rules={[{ required: true, message: '请选择目标类型' }]}
                  >
                    <div className="space-y-4">
                      <div
                        className={`cursor-pointer transition-all p-4 rounded-lg border-2 ${
                          selectedPlan === 'growth'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => {
                          form.setFieldsValue({ plan_choice: 'growth' });
                          handlePlanChange('growth');
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedPlan === 'growth' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          }`} />
                          <div>
                            <Text strong>Plan A：增长（Growth）</Text>
                            <br />
                            <Text type="secondary">把更多&quot;未付费用户&quot;变成付费（New Paid）。</Text>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`cursor-pointer transition-all p-4 rounded-lg border-2 ${
                          selectedPlan === 'retention'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => {
                          form.setFieldsValue({ plan_choice: 'retention' });
                          handlePlanChange('retention');
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedPlan === 'retention' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          }`} />
                          <div>
                            <Text strong>Plan B：留存（Retention）</Text>
                            <br />
                            <Text type="secondary">让&quot;已付费用户&quot;留得更久；我们只从 Cycle 11+ 的延寿增量开始计费。</Text>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`cursor-pointer transition-all p-4 rounded-lg border-2 ${
                          selectedPlan === 'growth_and_retention'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => {
                          form.setFieldsValue({ plan_choice: 'growth_and_retention' });
                          handlePlanChange('growth_and_retention');
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedPlan === 'growth_and_retention' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          }`} />
                          <div>
                            <Text strong>Plan A + B：增长 + 留存（Mix）</Text>
                            <br />
                            <Text type="secondary">同时做增长与留存；系统会给出推荐配比。</Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Form.Item>

                  {selectedPlan === 'growth_and_retention' && (
                    <Form.Item
                      name="primary_focus"
                      label="更偏向什么结果？"
                      rules={[{ required: true, message: '请选择主要关注点' }]}
                      tooltip="这会影响 Growth vs Retention 的推荐配比，以及 ROI 区间的保守/激进程度。"
                    >
                      <Radio.Group>
                        <Space direction="vertical" className="w-full">
                          <Radio value="maximize_new_paid">最大化新增付费（maximize_new_paid）</Radio>
                          <Radio value="maximize_net_profit">最大化净收益（maximize_net_profit）</Radio>
                          <Radio value="stabilize_retention">留存更稳定（更保守）（stabilize_retention）</Radio>
                        </Space>
                      </Radio.Group>
                    </Form.Item>
                  )}
                </div>

                <Divider />

                {/* Section C: 订阅与单位经济 */}
                <div className="mb-8">
                  <Title level={3} className="mb-4">3. 你的订阅业务基础</Title>

                  <Form.Item
                    name="pricing_model"
                    label="你的订阅是按月还是按年？"
                    rules={[{ required: true, message: '请选择定价模式' }]}
                  >
                    <Select onChange={handlePricingModelChange} size="large">
                      <Option value="monthly">按月（Monthly）</Option>
                      <Option value="annual">按年（Annual）</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="price_month_equiv_usd"
                    label={pricingModel === 'monthly' ? '每月价格' : '每年价格（我们会换算成月等价）'}
                    rules={[
                      { required: true, message: '请输入订阅价格' },
                      { type: 'number', min: 0.01, message: '价格必须大于0' }
                    ]}
                    tooltip="用于估算'增量订阅收入'。年付会按月等价账期折算。"
                  >
                    <InputNumber
                      min={0.01}
                      step={0.01}
                      prefix={<DollarOutlined />}
                      className="w-full"
                      size="large"
                    />
                  </Form.Item>


                  <Form.Item
                    name="free_subscribers_est"
                    label="你的全部订阅用户规模"
                    rules={[
                      { required: true, message: '请输入免费用户规模' },
                      { type: 'number', min: 0, message: '用户规模不能为负数' }
                    ]}
                    tooltip="用于估算 Plan A 的投放池。"
                  >
                    <InputNumber
                      min={0}
                      className="w-full"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="paid_subscribers_est"
                    label="你的付费订阅用户规模（估算）"
                    rules={[
                      { required: true, message: '请输入付费用户规模' },
                      { type: 'number', min: 0, message: '用户规模不能为负数' }
                    ]}
                    tooltip="用于估算 Plan B 的投放池与留存机会。"
                  >
                    <InputNumber
                      min={0}
                      className="w-full"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="baseline_avg_paid_lifetime_months_L0"
                    label="当前平均付费寿命（个月）"
                    rules={[
                      { required: true, message: '请输入平均付费寿命' },
                      { type: 'number', min: 0.1, message: '付费寿命必须大于0' }
                    ]}
                    tooltip="用于估算留存价值（延寿）和长期净收益。"
                  >
                    <InputNumber
                      min={0.1}
                      step={0.1}
                      placeholder="例如：6 或 11.5"
                      className="w-full"
                      size="large"
                    />
                  </Form.Item>
                </div>

                {/* Section D: 留存补充 (仅Plan B/Plan A+B显示) */}
                {(selectedPlan === 'retention' || selectedPlan === 'growth_and_retention') && (
                  <>
                    <Divider />
                    <div className="mb-8">
                      <Title level={3} className="mb-4">4. 留存补充</Title>

                      <Form.Item
                        name="dropoff_peak_window"
                        label="你的流失高峰通常发生在第几个月？"
                        rules={[{ required: true, message: '请选择流失高峰窗口' }]}
                      >
                        <Select size="large">
                          <Option value="M1">第 1 个月（M1）</Option>
                          <Option value="M2">第 2 个月（M2）</Option>
                          <Option value="M3">第 3 个月（M3）</Option>
                          <Option value="M4">第 4 个月（M4）</Option>
                          <Option value="M6">第 6 个月（M6）</Option>
                          <Option value="M12">第 12 个月（M12）</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name="expected_extra_paid_months"
                        label="预期额外付费月数（Cycle 11+）"
                        rules={[
                          { required: true, message: '请输入预期额外付费月数' },
                          { type: 'number', min: 0, message: '月数不能为负数' }
                        ]}
                        tooltip="Why Cycle 11+? Retention is billed only after Cycle 10, so we count only what can be billed."
                      >
                        <InputNumber
                          min={0}
                          step={0.1}
                          className="w-full"
                          size="large"
                        />
                      </Form.Item>
                    </div>
                  </>
                )}

                {/* Generate Button */}
                <Form.Item className="mt-8">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    className="w-full h-12 text-lg font-semibold"
                    disabled={!pilotCost}
                  >
                    <CalculatorOutlined className="mr-2" />
                    Generate Plan
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Pilot Cost Card */}
              <div className="bg-white p-6 rounded-lg shadow-lg border">
                <div className="flex items-center mb-4">
                  <DollarOutlined className="mr-2" />
                  <Title level={4} className="mb-0">Pilot Cost</Title>
                </div>
                <div className="text-center">
                  <Text className="text-3xl font-bold text-green-600">
                    ${pilotCost.toLocaleString()}
                  </Text>
                  <br />
                  <Text type="secondary">
                    $10 × {magnetsM || 0} = ${pilotCost.toLocaleString()}
                  </Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    10$/user
                  </Text>
                </div>
              </div>

              {/* Billing Rules Card */}
              <div className="bg-white p-6 rounded-lg shadow-lg border">
                <div className="flex items-center mb-4">
                  <InfoCircleOutlined className="mr-2" />
                  <Title level={4} className="mb-0">计费口径提示</Title>
                </div>
                <Alert
                  message="我们只对增量结果收费：Growth（New Paid）与 Retention（Cycle 11+）。费率固定 10%，且不叠加。"
                  type="info"
                  showIcon
                  className="mb-4"
                />
                <Text type="secondary" className="text-sm block mb-2">
                  <strong>Growth 归因：</strong>触达后变付费，不要求必须点 CTA 才付款
                </Text>
                <Text type="secondary" className="text-sm block">
                  <strong>Retention：</strong>只从第 11 个账期开始计费
                </Text>
                <Divider className="my-3" />
                <Text type="secondary" className="text-xs font-semibold">
                  No evidence, no bill.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilotCalculator;
