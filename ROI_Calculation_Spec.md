# ROI Engine Implementation Spec (v1.0)

## Overview
This document describes the technical implementation of the ROI calculation logic, based on the `ROI Engine.md` commercial model. The logic is encapsulated in a standalone TypeScript library and bound to the Next.js frontend.

## Implementation Details

### Core Logic: `lib/roi.ts`
The core formulas are implemented in `lib/roi.ts`. This file checks for:
- TypeScript interfaces for inputs and results.
- **Dynamic Configuration** via `RoiConfig` object.
- Pure function `calculateRoi(inputs, config)` that returns full ROI breakdown.

#### Configuration (`RoiConfig`)
The following parameters are configurable. You can pass a custom config object to `calculateRoi` to override defaults.

| Parameter | Key | Default | Description |
|-----------|-----|---------|-------------|
| **Gross Margin** | `grossMargin` | 0.8 | Creator's gross margin. |
| **Share** | `fcShare` | 0.10 | Platform fee share (10%). |
| **Magnet Cost** | `costPerMagnetUsd` | 10 | Cost per unit in USD. |
| **Growth Conversion** | `conversionRateGrowth` | 0.10 | `Δc`: Conversion rate from free magnet to paid sub (10%). |
| **Churn Improvement** | `churnImprovement` | 0.10 | `u`: Relative improvement in churn (10%). |
| **Retention Coverage** | `retentionCoverage` | 0.5 | `a`: % of paid users who adopt the habit (Conservative 50%). |
| **Horizon** | `horizonMonths` | 12 | Timeframe for ROI (12 months). |

### Formulas Implemented

#### 1. Allocation Strategy
Logic to split magnets between Free and Paid users.
- **Rule**: `M_paid = max(200, 15% * Total)`
- **Guardrails**: Caps `M_paid` at actual paid subscriber count.

#### 2. Track A: Growth (New Paid)
Direct revenue from converting free users.
```typescript
NewPaid = M_free * conversionRateGrowth
Profit = NewPaid * (ARPPU * (1 - Share) * GM * 12)
```

#### 3. Track B: Retention (Saved Paid)
Revenue saved by reducing churn for paid users.
```typescript
ΔL = (u / (1 - u)) * L0
ΔL_effective = retentionCoverage * ΔL
ExtraMonths = M_paid * ΔL_effective
Profit = ExtraMonths * (ARPPU * (1 - Share) * GM)
```

#### 4. Total ROI
```typescript
NetGain = (GrowthProfit + RetentionProfit) - TotalCost
ROI = NetGain / TotalCost
Payback = TotalCost / (TotalProfit / 12)
```

## Frontend Binding

### `app/deploy-plan/page.tsx`
The results page now imports `calculateRoi` from `lib/roi.ts`.
- **Inputs**: Reads `paidSubscribers`, `totalSubscribers`, `avgLifetimeMonths`, `arppuMonthlyUsd` from URL query params.
- **Execution**: Calls `calculateRoi(inputs)`.
- **Display**:
    - **Net Gain**: Displays `results.total.netGain12m`.
    - **Allocation**: Displays split from `results.allocation`.
    - **Payback**: Displays `results.total.paybackMonths`.

## How to Adjust Parameters
To change the default assumptions (e.g., if you want to assume 5% conversion instead of 10%):

1. Open `lib/roi.ts`.
2. Modify the `DEFAULT_CONFIG` object:
   ```typescript
   export const DEFAULT_CONFIG: RoiConfig = {
     ...
     conversionRateGrowth: 0.05, // Change to 0.05
     ...
   }
   ```
3. Alternatively, in `app/deploy-plan/page.tsx`, you can verify different scenarios by passing a partial config:
   ```typescript
   const results = calculateRoi(inputs, {
     ...DEFAULT_CONFIG,
     conversionRateGrowth: 0.05
   })
   ```
