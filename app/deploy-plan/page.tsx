"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ArrowLeft, TrendingUp, Repeat, Info } from "lucide-react"

// Fixed constants (Pilot)
const MAGNET_UNIT_COST_USD = 10
const DEFAULT_HORIZON_MONTHS = 12
const DEPLOYMENT_MAGNETS_M = 2000

// FC promises
const PROMISE_CONVERSION_LIFT_PP = 10 // +10%
const PROMISE_RETENTION_LIFT_PCT = 2 // +2%

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
    formatDate(addDays(today, 0)), // Step 1: Kickoff: today
    formatDate(addDays(today, 2)), // Step 2: Asset Handoff: 2 days
    formatDate(addDays(today, 5)), // Step 3: Link & Flow Validation: 5 days
    formatDate(addDays(today, 9)), // Step 4: Design Approval: 9 days
    formatDate(addDays(today, 12)), // Step 5: Sampling (Deposit): 12 days
    formatDate(addDays(today, 15)), // Step 6: Sample Acceptance: 15 days
    formatDate(addDays(today, 35)), // Step 7: Mass Production & Shipping: 35 days
    formatDate(addDays(today, 50)), // Step 8: Delivery received & Final Payment: 50 days
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
            <div className="mb-2 flex items-center justify-center gap-2 text-base font-medium text-muted-foreground">
              You'll net
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>12-month projection · base case · measured deployment</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              +${netGainUsd.toLocaleString()} / year
            </div>
            <div className="text-xs text-muted-foreground">Estimated over 12 months, after all costs.</div>
          </div>
        </div>

        {/* Section 2: Recommended Plan */}
        <div className="mb-16 space-y-4">
          <h2 className="text-xl font-semibold">Recommanded Plan</h2>
          {/* Row 1: KPI Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* KPI Card A: Upfront */}
            <div className="flex flex-col rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Upfront
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>One-time production and deployment cost for the pilot batch.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* First line: = quantity × unit price */}
              <div className="mb-2 flex flex-wrap items-baseline gap-1 text-sm">
                <span className="text-muted-foreground">=</span>
                <span className="font-semibold">{DEPLOYMENT_MAGNETS_M.toLocaleString()}</span>
                <span className="text-muted-foreground">magnets ×</span>
                <span className="font-semibold">${MAGNET_UNIT_COST_USD}</span>
                <span className="text-muted-foreground">/ magnet</span>
              </div>
              {/* Second line: total price */}
              <div className="text-2xl font-bold tracking-tight">
                ${upfrontCostUsd.toLocaleString()}
              </div>
            </div>
            
            {/* KPI Card B: Payback */}
            <div className="flex flex-col rounded-lg border bg-card p-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Payback
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estimated time to recover upfront cost if projected effects persist.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="mb-1.5 flex-1 text-2xl font-bold tracking-tight">~{paybackMonths} months</div>
              <div className="text-xs text-muted-foreground">{planName}</div>
            </div>
          </div>

          {/* Row 2: Total + Allocation */}
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Total magnets</div>
              <div className="text-xl font-semibold">{DEPLOYMENT_MAGNETS_M.toLocaleString()}</div>
            </div>
            <div className="flex-1 sm:px-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs">
                <span className="font-medium text-muted-foreground">Allocation</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Asset allocation aims to maximize your goals while controlling cost risks.</p>
                  </TooltipContent>
                </Tooltip>
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
                title: "Kickoff",
                description: "Confirm quantity, timeline, pricing, points of contact, and communication cadence.",
              },
              {
                title: "Asset Handoff",
                description: "Supplier provides brand assets and content source (link/RSS/page).",
              },
              {
                title: "Link & Flow Validation",
                description: "FC validates the NFC destination and the subscription/payment flow (including tracking parameters).",
              },
              {
                title: "Design Approval",
                description: "FC delivers design drafts; supplier approves final visuals/copy → version is frozen.",
              },
              {
                title: "Sampling (Deposit)",
                description: "Supplier pays the deposit; FC starts sampling and ships the sample.",
              },
              {
                title: "Sample Acceptance",
                description: "Supplier confirms \"approved / minor edits needed\" within 48–72 hours (per acceptance criteria).",
              },
              {
                title: "Mass Production & Shipping",
                description: "FC mass produces, QA checks, and ships;",
              },
              {
                title: "Delivery received & Final Payment",
                description: "Supplier received magnets, and pays the balance after receipt and inspection.",
              },
            ].map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background font-semibold text-primary">
                    {index + 1}
                  </div>
                  {index < 7 && <div className="w-0.5 flex-1 bg-border" />}
                </div>
                <div className="flex-1 pb-8">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-semibold">{step.title}</span>
                    {timelineDates[index] && (
                      <span className="text-xs font-medium text-muted-foreground">{timelineDates[index]}</span>
                    )}
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
