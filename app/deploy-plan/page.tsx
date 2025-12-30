"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown } from "lucide-react"

// FC promises
import { calculateRoi, recommendPilotSize, type RoiInputs, DEFAULT_CONFIG } from "@/lib/roi"

// Constants
const PROMISE_CONVERSION_LIFT_PP = DEFAULT_CONFIG.conversionUpliftAlpha * 100
const PROMISE_RETENTION_LIFT_PCT = DEFAULT_CONFIG.churnReductionBeta * 100

function generateTimelineDates() {
  const today = new Date()

  const addDays = (date: Date, days: number) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return [
    formatDate(addDays(today, 0)), // Kickoff: today
    formatDate(addDays(today, 4)), // Design: 4 days
    formatDate(addDays(today, 9)), // Sampling: 9 days
    formatDate(addDays(today, 18)), // Production: 18 days
    formatDate(addDays(today, 32)), // Shipping: 32 days
    formatDate(addDays(today, 40)), // Rollout: 40 days
    formatDate(addDays(today, 60)), // First review: 60 days (~2 months)
  ]
}

function DeployPlanContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get data from URL params or use mock data
  const paidSubscribers = Number(searchParams.get("paidSubscribers") || 800)
  const totalSubscribers = Number(searchParams.get("totalSubscribers") || 12000)
  const avgLifetimeMonths = Number(searchParams.get("avgLifetimeMonths") || 7)
  const arppuMonthlyUsd = Number(searchParams.get("arppuMonthlyUsd") || 29)
  const planChoice = (searchParams.get("planChoice") || "growth_only") as "growth_only" | "growth_and_retention"

  const freeSubscribers = Math.max(0, totalSubscribers - paidSubscribers)

  // Calculate ROI metrics using the real logic
  const inputs: RoiInputs = {
    // We pass 0 here temporarily because we need to calculate the recommended size first
    totalMagnets: 0,
    paidSubscribers,
    freeSubscribers,
    arppuMonthlyUsd,
    avgLifetimeMonths,
    planChoice,
    baselineMonthlyConversion: searchParams.get("baselineMonthlyConversion")
      ? Number(searchParams.get("baselineMonthlyConversion"))
      : undefined
  }

  // Calculate recommended pilot size dynamically
  const recommendedMagnets = recommendPilotSize(inputs)

  // Update inputs with recommended size
  inputs.totalMagnets = recommendedMagnets

  const results = calculateRoi(inputs)

  const { allocation, total } = results
  const allocationFree = allocation.free
  const allocationPaid = allocation.paid
  const upfrontCostUsd = total.pilotCost
  const netGainUsd = Math.round(total.netGain12m)
  const paybackMonths = Math.round(total.paybackMonths * 10) / 10

  // Constants for display
  const deploymentMagnets = recommendedMagnets
  const magnetUnitCost = DEFAULT_CONFIG.costPerMagnetUsd

  const timelineDates = generateTimelineDates()

  const handleStartPilot = () => {
    console.log("[v0] Starting pilot with upfront cost:", upfrontCostUsd)
    router.push("/checkout")
  }

  const planName = planChoice === "growth_only" ? "Plan A — Growth Only" : "Plan B — Growth + Retention"

  const allocationPercentFree = Math.round((allocationFree / deploymentMagnets) * 100)
  const allocationPercentPaid = 100 - allocationPercentFree

  return (
    <div className="min-h-screen bg-background p-2">
      {/* Back button */}
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="mb-12 text-center text-4xl font-bold tracking-tight sm:text-5xl">Deployment Plan</h1>

        {/* Section 1: Net Gain */}
        <div className="mb-16">
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
            <div className="mb-2 text-base font-medium text-muted-foreground">You'll net</div>
            <div className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              +${netGainUsd.toLocaleString()} / year
            </div>
            <div className="text-xs text-muted-foreground">Estimated over 12 months, after all costs.</div>
          </div>
        </div>

        {/* Section 2: Recommended Plan */}
        <div className="mb-16 space-y-4">
          <h2 className="text-xl font-semibold">Recommended Plan</h2>
          {/* Row 1: KPI Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* KPI Card A: Upfront */}
            <div className="flex flex-col rounded-lg border bg-card p-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">Upfront</div>
              {/* First line: = quantity × unit price */}
              <div className="mb-2 flex flex-wrap items-baseline gap-1 text-sm">
                <span className="text-muted-foreground">=</span>
                <span className="font-semibold">{deploymentMagnets.toLocaleString()}</span>
                <span className="text-muted-foreground">magnets ×</span>
                <span className="font-semibold">${magnetUnitCost}</span>
                <span className="text-muted-foreground">/ magnet</span>
              </div>
              {/* Second line: total price */}
              <div className="text-2xl font-bold tracking-tight">
                ${upfrontCostUsd.toLocaleString()}
              </div>
            </div>

            {/* KPI Card B: Payback */}
            <div className="flex flex-col rounded-lg border bg-card p-4">
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Payback</div>
              <div className="mb-1.5 flex-1 text-2xl font-bold tracking-tight">~{paybackMonths} months</div>
              <div className="text-xs text-muted-foreground">{planName}</div>
            </div>
          </div>

          {/* Row 2: Total + Allocation */}
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Total magnets</div>
              <div className="text-xl font-semibold">{deploymentMagnets.toLocaleString()}</div>
            </div>
            <div className="flex-1 sm:px-4">
              <div className="mb-2 text-xs">
                <span className="font-medium text-muted-foreground">Allocation</span>
              </div>
              <div className="flex h-6 overflow-hidden rounded-lg border">
                <div
                  className="flex items-center justify-center bg-purple-500 text-xs font-medium text-white"
                  style={{ width: `${allocationPercentFree}%` }}
                >
                  {allocationPercentFree > 15 && `Free User ${allocationFree.toLocaleString()}`}
                </div>
                <div
                  className="flex items-center justify-center bg-blue-500 text-xs font-medium text-white"
                  style={{ width: `${allocationPercentPaid}%` }}
                >
                  {allocationPercentPaid > 15 && `Paid User ${allocationPaid.toLocaleString()}`}
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Based on{" "}
                {planChoice === "growth_only"
                  ? `Growth +${PROMISE_CONVERSION_LIFT_PP}% target`
                  : `Retention +${PROMISE_RETENTION_LIFT_PCT}% target`}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Timeline */}
        <div className="mb-16 space-y-6">
          <h2 className="text-2xl font-semibold">What happens next</h2>
          <div className="space-y-4">
            {[
              {
                title: "Kickoff & targeting",
                description: "Confirm target pools and list criteria.",
              },
              {
                title: "Design final",
                description: "Finalize the magnet creative.",
              },
              {
                title: "Sampling",
                description: "Approve sample before production.",
              },
              {
                title: "Production",
                description: "Manufacture the pilot batch.",
              },
              {
                title: "Shipping",
                description: "Delivery to target audience.",
              },
              {
                title: "Rollout",
                description: "Staggered delivery for measurement.",
              },
              {
                title: "First review",
                description: "Review evidence + invoice-aligned outcomes.",
              },
            ].map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background font-semibold text-primary">
                    {index + 1}
                  </div>
                  {index < 6 && <div className="w-0.5 flex-1 bg-border" />}
                </div>
                <div className="flex-1 pb-8">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-semibold">{step.title}</span>
                    <span className="text-xs font-medium text-muted-foreground">{timelineDates[index]}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Financial Breakdown */}
        <section className="mb-16 space-y-4">
          <details className="group rounded-xl border bg-card shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between p-6 text-lg font-semibold">
              <span>Profit Breakdown</span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t p-6 bg-muted/20">
              <p className="text-xs text-muted-foreground mb-6">
                Financial outcomes are evaluated <strong>after usage signals stabilize</strong>.
              </p>
              <div className="grid gap-8 sm:grid-cols-3 mb-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Net Gain (Est.)</div>
                  <div className="text-xl font-bold text-green-700">+${netGainUsd.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ROI Multiplier</div>
                  <div className="text-xl font-semibold">{(results.total.roi12m).toFixed(1)}x</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Payback Speed</div>
                  <div className="text-xl font-semibold">~{paybackMonths} months</div>
                </div>
              </div>

              {/* Breakdown: Free vs Paid Earnings */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-dashed">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">From Growth (Free → Paid):</span>
                  <span className="font-medium">+${Math.round(results.growth.profit12m).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">From Retention (Saved Users):</span>
                  <span className="font-medium">+${Math.round(results.retention.profit12m).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </details>
        </section>

      </div>

      {/* Sticky footer CTA */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-4xl items-center justify-end px-4 py-4 sm:px-6 lg:px-8">
          <Button size="lg" onClick={handleStartPilot} className="sm:min-w-[200px]">
            Email to me
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DeployPlanPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <DeployPlanContent />
    </Suspense>
  )
}
