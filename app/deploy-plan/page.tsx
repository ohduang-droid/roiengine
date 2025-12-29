"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// Fixed constants (Pilot)
const MAGNET_UNIT_COST_USD = 10
const DEFAULT_HORIZON_MONTHS = 12
const DEPLOYMENT_MAGNETS_M = 2000

// FC promises
const PROMISE_CONVERSION_LIFT_PP = 1 // +1pp
const PROMISE_RETENTION_LIFT_PCT = 5 // +5%

// Calculation functions (mock implementation, to be replaced with real ROI calculations)
function calculateAllocation(
  planChoice: string,
  totalMagnets: number,
  paidSubscribers: number,
  freeSubscribers: number,
) {
  let allocationFree: number
  let allocationPaid: number

  if (planChoice === "growth_only") {
    // Growth only: 75% to free, 25% to paid
    allocationFree = Math.round(totalMagnets * 0.75)
    allocationPaid = totalMagnets - allocationFree
  } else {
    // Growth + Retention: 75% to paid, 25% to free
    allocationPaid = Math.round(totalMagnets * 0.75)
    allocationFree = totalMagnets - allocationPaid
  }

  // Apply guardrails
  if (allocationPaid > paidSubscribers) {
    const excess = allocationPaid - paidSubscribers
    allocationPaid = paidSubscribers
    allocationFree = Math.min(allocationFree + excess, freeSubscribers)
  }

  if (allocationFree > freeSubscribers) {
    const excess = allocationFree - freeSubscribers
    allocationFree = freeSubscribers
    allocationPaid = Math.min(allocationPaid + excess, paidSubscribers)
  }

  return { allocationFree, allocationPaid }
}

function calculateROI(
  paidSubscribers: number,
  avgLifetimeMonths: number,
  arppuMonthlyUsd: number,
  planChoice: string,
  totalMagnets: number,
) {
  // Mock calculation - replace with real formula
  const upfrontCost = totalMagnets * MAGNET_UNIT_COST_USD

  // Simple estimation: conversion lift + retention lift effects
  const baseMonthlyRevenue = paidSubscribers * arppuMonthlyUsd
  const conversionLiftRevenue =
    paidSubscribers * PROMISE_CONVERSION_LIFT_PP * 0.01 * arppuMonthlyUsd * DEFAULT_HORIZON_MONTHS
  const retentionLiftRevenue =
    planChoice === "growth_and_retention"
      ? baseMonthlyRevenue * (PROMISE_RETENTION_LIFT_PCT / 100) * (DEFAULT_HORIZON_MONTHS / 2)
      : 0

  const totalRevenueLift = conversionLiftRevenue + retentionLiftRevenue
  const netGainUsd = Math.round(totalRevenueLift - upfrontCost)
  const paybackMonths = upfrontCost > 0 ? upfrontCost / (totalRevenueLift / DEFAULT_HORIZON_MONTHS) : 0

  return {
    upfrontCostUsd: upfrontCost,
    netGainUsd,
    paybackMonths: Math.round(paybackMonths * 10) / 10, // 1 decimal place
  }
}

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

  // Calculate allocation
  const { allocationFree, allocationPaid } = calculateAllocation(
    planChoice,
    DEPLOYMENT_MAGNETS_M,
    paidSubscribers,
    freeSubscribers,
  )

  // Calculate ROI metrics
  const { upfrontCostUsd, netGainUsd, paybackMonths } = calculateROI(
    paidSubscribers,
    avgLifetimeMonths,
    arppuMonthlyUsd,
    planChoice,
    DEPLOYMENT_MAGNETS_M,
  )

  const timelineDates = generateTimelineDates()

  const handleStartPilot = () => {
    console.log("[v0] Starting pilot with upfront cost:", upfrontCostUsd)
    router.push("/checkout")
  }

  const planName = planChoice === "growth_only" ? "Plan A — Growth Only" : "Plan B — Growth + Retention"
  const planRationale =
    planChoice === "growth_only"
      ? "Optimized to maximize conversion."
      : "Optimized to maximize net renewals while still growing paid."

  const allocationPercentFree = Math.round((allocationFree / DEPLOYMENT_MAGNETS_M) * 100)
  const allocationPercentPaid = 100 - allocationPercentFree

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Edit inputs
        </Button>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Section 1: Hero - Net Gain */}
        <div className="mb-16 space-y-8">
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-12">
            <div className="mb-3 text-lg font-medium text-muted-foreground">You'll net</div>
            <div className="mb-2 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              +${netGainUsd.toLocaleString()}
            </div>
            <div className="mb-6 text-sm text-muted-foreground">Estimated over 12 months, after all costs.</div>

            {/* Promise KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Conversion (free → paid):</span>
                  <span className="font-semibold">+{PROMISE_CONVERSION_LIFT_PP}pp</span>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Retention (paid renewals):</span>
                  <span className="font-semibold">+{PROMISE_RETENTION_LIFT_PCT}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Small KPIs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">Upfront</div>
              <div className="mb-1 text-3xl font-bold">${upfrontCostUsd.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {DEPLOYMENT_MAGNETS_M.toLocaleString()} magnets × ${MAGNET_UNIT_COST_USD}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">Payback</div>
              <div className="mb-1 text-3xl font-bold">~{paybackMonths} months</div>
              <div className="text-xs text-muted-foreground">Time to recover investment</div>
            </div>
          </div>
        </div>

        {/* Section 2: Recommended Plan */}
        <div className="mb-16 space-y-6">
          <h2 className="text-2xl font-semibold">Your recommended plan</h2>
          <div className="space-y-6 rounded-xl border bg-card p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Total magnets</div>
                <div className="text-2xl font-semibold">{DEPLOYMENT_MAGNETS_M.toLocaleString()}</div>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Plan type</div>
                <div className="text-2xl font-semibold">{planName}</div>
              </div>
            </div>

            {/* Allocation bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Allocation</span>
                <span className="text-sm text-muted-foreground">
                  Free {allocationFree.toLocaleString()} / Paid {allocationPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex h-8 overflow-hidden rounded-lg border">
                <div
                  className="flex items-center justify-center bg-purple-500 text-xs font-medium text-white"
                  style={{ width: `${allocationPercentFree}%` }}
                >
                  {allocationPercentFree > 15 && `Free User`}
                </div>
                <div
                  className="flex items-center justify-center bg-blue-500 text-xs font-medium text-white"
                  style={{ width: `${allocationPercentPaid}%` }}
                >
                  {allocationPercentPaid > 15 && `Paid User`}
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="text-sm text-muted-foreground">{planRationale}</div>
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
