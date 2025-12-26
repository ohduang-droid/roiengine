# ROI Engine v1.1

Pilot ROI Calculator and Deployment Plan Generator based on ROiEngineV1.1.pdf specifications.

## Features

### Pilot ROI Calculator (Homepage)
- **Pilot Scale**: Configure number of magnets to deploy (1500-2999 range)
- **Target Selection**:
  - Plan A: Growth (New Paid focus)
  - Plan B: Retention (Cycle 11+ incremental value)
  - Plan A+B: Mixed growth and retention with customizable focus
- **Subscription Business Basics**:
  - Pricing model (Monthly/Annual)
  - Price per month equivalent
  - Gross margin
  - User scale estimates (free/paid)
  - Baseline average paid lifetime
- **Retention Details** (Plan B/A+B only):
  - Drop-off peak window
  - Expected extra paid months (Cycle 11+)

### Deployment Plan Results
- **Recommended Allocation**: Growth vs Retention percentage split
- **Audience Definition**: Target audience specifications
- **ROI Scenarios**: Low/Mid/High ranges for New Paid and Billable Extra Cycles
- **Customer Net ROI**: Year 1/2/3 profit uplift, payback months, ROI multiple
- **Confidence & Assumptions**: Benchmark sources and confidence levels
- **Next Experiments**: Two follow-up experiments to converge ROI
- **Actions**: Copy Plan, Email to me/team, Export PDF (planned)

## Technical Stack

- **Frontend Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript
- **UI Components**: Ant Design + TailwindCSS
- **State Management**: React hooks + localStorage for form persistence

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Key Features Implemented

### Form Validation
- Pilot scale: 1500-2999 magnets required
- All business metrics validated (positive numbers, percentage ranges)
- Conditional fields based on plan selection

### Responsive Design
- Mobile-first approach with TailwindCSS
- Grid layout adapts to screen sizes
- Sticky sidebar on desktop

### Mock Data Integration
- Realistic ROI calculations based on plan type
- Scenario ranges (Low/Mid/High) for conservative estimates
- Benchmark-based assumptions

### Billing Rules Compliance
- Only incremental results charged (Growth New Paid + Retention Cycle 11+)
- Fixed 10% fee rate, no stacking
- "No evidence, no bill" principle built into UI

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Ant Design registry
│   ├── page.tsx            # Pilot Calculator homepage
│   └── deployment-plan/
│       └── page.tsx        # Results page
├── components/
│   ├── PilotCalculator.tsx # Main form component
│   └── DeploymentPlan.tsx  # Results display component
├── lib/
│   └── types.ts            # TypeScript interfaces
└── mock/
    └── deployment-plans.ts # Mock data for different scenarios
```

## Usage Flow

1. **Fill Form**: Complete all required fields in the Pilot ROI Calculator
2. **Real-time Cost**: See pilot cost calculation ($10 × magnets) in sidebar
3. **Generate Plan**: Click "Generate Plan" to create deployment strategy
4. **Review Results**: Analyze ROI scenarios, allocation recommendations, and next experiments
5. **Take Action**: Copy plan details or email to stakeholders

## Future Enhancements

- PDF export functionality
- Real API integration (currently using mock data)
- Enhanced experiment suggestions
- Historical plan tracking
- Multi-language support