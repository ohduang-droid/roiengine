---

# Touchpoint ROI Engine

## Dual-Track Commercial Model & Pilot Allocation Spec (v1.0)

---

## 0. 文档目的（Why this document exists）

本文件用于回答三个问题：

1. **FC 的钱是怎么赚的，是否符合 newsletter 行业逻辑**
2. **Creator 投入一笔 pilot 成本后，12 个月内能否回本**
3. **在不夸大、不拍脑袋的前提下，如何推荐试点投放数量与 free / paid 配比**

> 本模型**不假设奇迹，不依赖一次性故事**，所有结果均可在 pilot 后用真实账期数据复核。

---

## 1. 双轨商业模型总览（Dual-Track Model）

FC 的商业模式由两条**完全不同、但互不冲突**的轨道组成：

### Track A — Growth（一次性、cohort-based）

> FC 触达 **free 用户**，带来**新增付费用户**（incremental new paid）。
> → 一次性增量，适合驱动 pilot 的**短期现金回报**。

### Track B — Retention（usage-qualified、按账期）

> FC 作为**持续使用入口**存在。
> 只要某个账期内：
>
> * 用户仍在付费
> * 且该账期内有 FC 使用证据
>   → FC 参与该账期订阅收入分成。
>   → **非一次性，可长期存在**。

---

## 2. 基本原则（防“被 diss”原则）

* **只算增量（Incremental only）**
* **No usage → no share**
* **按账期、按用户、可对账**
* **每用户每账期最多 10% 分成**
* **Creator 可随时停止**

---

## 3. 输入参数（Input Parameters）

### 3.1 投放与成本

```text
M_total            = 投放磁贴总数
M_free             = 投放到 free 用户
M_paid             = 投放到 paid 用户
cost_per_magnet    = $10
pilot_cost         = M_total × cost_per_magnet
```

约束：

```text
M_free + M_paid = M_total
```

---

### 3.2 订阅经济学

```text
P        = 月订阅费（USD）
GM       = 毛利率（默认 0.8）
share    = FC 分成比例（固定 0.10）
```

定义一个关键常量（后续会反复用）：

```text
K = P × (1 − share) × GM
```

> K = 每 1 个“付费人月”给 creator 带来的净利润

---

### 3.3 Growth 假设（free → paid）

```text
Δc = incremental free → paid conversion rate
```

> 绝对增量转化率，一次性事件

---

### 3.4 Retention 假设（用于预测）

```text
L0 = 平均留存月份
u  = churn 相对改善比例（10%–15%）
a  = 覆盖率（0–1，表示 paid 中真正形成 FC 使用习惯的比例）
```

---

## 4. Track A — Growth 计算公式（一次性）

### A1. 新增付费用户数

```text
NewPaid = M_free × Δc
```

---

### A2. Growth 增量订阅收入（12 个月展示口径）

```text
Revenue_growth_12m = NewPaid × P × 12
```

---

### A3. Creator Growth 增量净利润

```text
Creator_growth_profit_12m
= Revenue_growth_12m × (1 − share) × GM
= NewPaid × (K × 12)
```

---

## 5. Track B — Retention（usage-qualified）

### 5.1 真实计费逻辑（不依赖 ΔL）

对任一用户 i、账期 t：

```text
Eligible(i,t) = Paying(i,t) × Usage_FC(i,t)
```

```text
FC_fee(i,t) = Eligible(i,t) × P × share
Creator_profit(i,t) = Eligible(i,t) × K
```

> 这是**唯一的计费逻辑**，完全可审计。

---

### 5.2 预测层（用于 ROI 报告）

#### Step R1：churn → ΔL（仅用于预测）

```text
ΔL = (u / (1 − u)) × L0
ΔL_effective = a × ΔL
```

---

#### Step R2：12 个月内的增量使用人月

```text
Extra_paid_user_months_12m
= M_paid × ΔL_effective
```

---

#### Step R3：Retention 增量净利润（12 个月）

```text
Creator_retention_profit_12m
= Extra_paid_user_months_12m × K
```

---

## 6. Creator 12 个月 ROI 总公式

### 6.1 Creator 总增量净利润

```text
Creator_profit_12m
= Creator_growth_profit_12m
+ Creator_retention_profit_12m
```

---

### 6.2 Creator 净收益（扣除 pilot 成本）

```text
Creator_net_gain_12m
= Creator_profit_12m − pilot_cost
```

---

### 6.3 ROI

```text
ROI_12m = Creator_net_gain_12m / pilot_cost
```

---

## 7. 边际分析：为什么 free / paid 不能平均分？

### 7.1 每投 1 个 free 磁贴的期望净利润

```text
profit_per_free
= Δc × (K × 12) − cost_per_magnet
```

**free 的 break-even 条件：**

```text
Δc ≥ cost_per_magnet / (K × 12)
```

在常见参数下：

* Δc ≥ ~5.8% → free 首年可盈利

---

### 7.2 每投 1 个 paid 磁贴的期望净利润

```text
profit_per_paid
= ΔL_effective × K − cost_per_magnet
```

**paid 的 break-even 条件：**

```text
a × ΔL ≥ cost_per_magnet / K
≈ 0.694 月
```

> 在 u=10%、L0=5 时：
> ΔL≈0.56 → **首年亏**（这是正常的）

---

## 8. 推荐投放策略（关键结论）

### 8.1 为什么 paid 首年经常是亏的？

* retention 增量是**慢变量**
* 单个付费人月利润不足以覆盖 $10 获客成本
* paid 的价值在于：

  * 验证 usage-qualified 分成是否成立
  * 建立长期渠道逻辑

---

### 8.2 推荐的 Pilot 总量（M_total）

**决策依据：**

* 至少产生 **30–50 个 NewPaid**（否则容易被认为是随机）
* 又不把风险放大到不可控

推荐区间：

```text
M_total = 1500 – 2000
```

---

### 8.3 推荐 free / paid 配比（核心）

在大多数真实参数下（Δc≈8–12%、u≈10%）：

> **free 的边际利润 > paid**

因此推荐：

```text
M_paid = max(200, 15% × M_total)
M_free = M_total − M_paid
```

在 M_total=2000 时：

```text
M_paid ≈ 300  (15%)
M_free ≈ 1700 (85%)
```

---

### 8.4 为什么要保留 paid 的“最小量”？

不是为了赚钱，而是为了：

* 验证 usage 行为
* 观察 Eligible_paid_t 的真实分布
* 为后续扩大 paid 投放提供依据

---

## 9. 给 Creator 的关键结论（你可以直接引用）

> * **短期回款靠 Growth（free）**
> * **Retention 是长期 upside，而不是首年回本手段**
> * FC 不抽“本来就会发生的钱”
> * 只有当 FC 成为当期使用入口时，才参与分成

---

## 10. 一句话总结（内部决策用）

> **如果你想要 pilot 看起来成功，
> 就必须让 free 扛起 ROI；
> paid 的任务是证明 FC 值得被当成一个长期渠道。**

---
