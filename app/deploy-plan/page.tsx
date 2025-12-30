"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ArrowLeft, TrendingUp, Repeat, Info, FileDown, Mail } from "lucide-react"
import jsPDF from "jspdf"
import { toast } from "sonner"
import { calculateRoi, RoiInputs, DEFAULT_CONFIG } from "@/lib/roi"

// Fixed constants (Pilot)
const DEPLOYMENT_MAGNETS_M = 2000

// FC promises (Display only)
const PROMISE_CONVERSION_LIFT_PP = 10 // +10%
const PROMISE_RETENTION_LIFT_PCT = 2 // +2%

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
  const email = searchParams.get("email")
  const [isSending, setIsSending] = useState(false)

  const paidSubscribers = Number(searchParams.get("paidSubscribers") || 800)
  const totalSubscribers = Number(searchParams.get("totalSubscribers") || 12000)
  const avgLifetimeMonths = Number(searchParams.get("avgLifetimeMonths") || 7)
  const arppuMonthlyUsd = Number(searchParams.get("arppuMonthlyUsd") || 29)
  const planChoice = (searchParams.get("planChoice") || "growth_only") as "growth_only" | "growth_and_retention"
  const newPaidPerMonth = Number(searchParams.get("newPaidPerMonth") || 0)
  // dropoffPeakWindow is available but not used in math yet, just passed through if needed
  // const dropoffPeakWindow = searchParams.get("dropoffPeakWindow")

  const freeSubscribers = Math.max(0, totalSubscribers - paidSubscribers)

  // Calculate baseline conversion from Q4 if available
  let baselineMonthlyConversion: number | undefined = undefined
  if (newPaidPerMonth > 0 && freeSubscribers > 0) {
    baselineMonthlyConversion = newPaidPerMonth / freeSubscribers
  }

  // Use shared ROI calculation
  const roiInputs: RoiInputs = {
    totalMagnets: DEPLOYMENT_MAGNETS_M,
    paidSubscribers,
    freeSubscribers,
    arppuMonthlyUsd,
    avgLifetimeMonths,
    planChoice,
    baselineMonthlyConversion, // Pass derived or undefined (will use default in lib)
  }

  // Adaptive Horizon Logic
  // 1. Try 12 months (default)
  let effectiveHorizon = 12
  let roiResults = calculateRoi({ ...roiInputs, horizonChoice: 12 } as any) // Type assertion if needed, but calculateRoi uses config

  // 2. If negative, try 24 or 36
  if (roiResults.total.netGain12m < 0) {
    // If payback is reasonable but > 12 months, show longer horizon
    // Heuristic: If payback is < 24m, show 24m view. If > 24m, show 36m view.
    // Note: paybackMonths from first run might be 0/undefined if never profitable in 24m limit (old limit)
    // but we updated limit to 60m, so we should get a valid payback if it's within 5 years.

    const pb = roiResults.total.paybackMonths
    if (pb > 0 && pb <= 24) {
      effectiveHorizon = 24
    } else {
      effectiveHorizon = 36
    }

    // Recalculate with new horizon
    // We need to pass horizonMonths to config? calculateRoi takes inputs and config.
    // roi.ts:DEFAULT_CONFIG has horizonMonths. We need to override it.
    roiResults = calculateRoi(roiInputs, { ...DEFAULT_CONFIG, horizonMonths: effectiveHorizon })
  }

  const {
    allocation: { free: allocationFree, paid: allocationPaid },
    total: { pilotCost: upfrontCostUsd, netGain12m: netGainUsd, paybackMonths },
  } = roiResults

  const MAGNET_UNIT_COST_USD = DEFAULT_CONFIG.costPerMagnetUsd
  const timelineDates = generateTimelineDates()


  const handleStartPilot = () => {
    console.log("[v0] Starting pilot with upfront cost:", upfrontCostUsd)
    router.push("/checkout")
  }




  const generatePdfDoc = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20
    const margin = 20
    const lineHeight = 7
    const sectionSpacing = 10

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
      doc.setFontSize(fontSize)
      doc.setTextColor(color[0], color[1], color[2])
      if (isBold) {
        doc.setFont("helvetica", "bold")
      } else {
        doc.setFont("helvetica", "normal")
      }
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        if (yPos > pageHeight - 20) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, margin, yPos)
        yPos += lineHeight
      })
      return yPos
    }

    // Helper function to add bullet points
    const addBullet = (text: string, fontSize: number = 11) => {
      if (yPos > pageHeight - 20) {
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", "normal")
      doc.text("•", margin, yPos)
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 5)
      lines.forEach((line: string, index: number) => {
        if (yPos > pageHeight - 20) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, margin + 5, yPos)
        yPos += lineHeight
      })
    }

    // Cover
    yPos = 40
    addText("FC Deployment Plan", 24, true)
    yPos += sectionSpacing * 2
    addText("A measured pilot for subscriber growth", 16, true)
    yPos += sectionSpacing * 3
    addText(`Prepared for: ${email || "Client"}`, 12)
    yPos += lineHeight * 1.5
    addText("Prepared by: Fridge Channel (FC)", 12)
    yPos += lineHeight * 1.5
    addText(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 12)
    yPos += sectionSpacing * 3
    addText("A structured experiment to test whether physical NFC touchpoints can drive measurable subscription outcomes.", 11, false, [100, 100, 100])
    yPos += sectionSpacing * 3

    // Executive Summary
    addText("Executive Summary", 18, true)
    yPos += sectionSpacing * 2

    addText("What this is", 14, true)
    yPos += sectionSpacing
    addText("This document outlines a pilot deployment plan to test the impact of physical NFC magnets on subscription-driven businesses.", 11)
    yPos += sectionSpacing
    addText("The goal is to evaluate whether a persistent, offline touchpoint can improve:", 11)
    yPos += sectionSpacing
    addBullet("Subscriber acquisition behavior", 11)
    addBullet("Engagement between content sessions", 11)
    addBullet("Early signals of renewal intent", 11)
    yPos += sectionSpacing
    addText("This is not a guaranteed ROI program, but a controlled experiment with defined cost, scope, and review points.", 11, true)
    yPos += sectionSpacing * 2

    addText("Key numbers (" + (effectiveHorizon / 12) + "-Year base case)", 14, true)
    yPos += sectionSpacing
    addBullet(`Estimated net impact: ${netGainUsd >= 0 ? "+" : ""}$${netGainUsd.toLocaleString()} / ${effectiveHorizon === 12 ? "Year" : (effectiveHorizon / 12) + " Years"}`, 11)
    addBullet(`Upfront investment: $${upfrontCostUsd.toLocaleString()}`, 11)
    addBullet(`Estimated payback period: ~${paybackMonths} months`, 11)
    yPos += sectionSpacing
    addText("These figures reflect a base-case projection over the first " + (effectiveHorizon / 12) + (effectiveHorizon === 12 ? " Year" : " Years") + ", assuming current pricing and billing cadence remain unchanged.", 10, false, [100, 100, 100])
    yPos += sectionSpacing * 3

    // Why this pilot exists
    addText("Why this pilot exists", 18, true)
    yPos += sectionSpacing * 2

    addText("The subscription problem FC is addressing", 14, true)
    yPos += sectionSpacing
    addText("Content subscriptions rarely fail due to content quality.", 11)
    yPos += lineHeight
    addText("They fail because value fades between sessions.", 11, true)
    yPos += sectionSpacing * 2

    addText("Common patterns we observe:", 11, true)
    yPos += sectionSpacing
    addBullet("Users intend to return, but forget", 11)
    addBullet("Paid subscribers feel less perceived value before renewal", 11)
    addBullet("Most touchpoints are ephemeral (inbox, feeds, notifications)", 11)
    yPos += sectionSpacing * 2

    addText("FC's core hypothesis is simple:", 11, true)
    yPos += sectionSpacing
    addText("Persistent physical touchpoints can extend content recall and subscription intent over time.", 11, true)
    yPos += sectionSpacing
    addText("This pilot exists to test that hypothesis under real operating conditions.", 11)
    yPos += sectionSpacing * 3

    // What is being deployed
    addText("What is being deployed", 18, true)
    yPos += sectionSpacing * 2

    addText("Deployment scope", 14, true)
    yPos += sectionSpacing
    addBullet(`Total magnets: ${DEPLOYMENT_MAGNETS_M.toLocaleString()}`, 11)
    addBullet(`Unit cost: $${MAGNET_UNIT_COST_USD} / magnet`, 11)
    addBullet(`Total upfront cost: $${upfrontCostUsd.toLocaleString()}`, 11)
    yPos += sectionSpacing
    addText("This quantity is selected to balance signal strength and cost efficiency for an initial deployment.", 11)
    yPos += sectionSpacing * 2

    addText("Allocation logic", 14, true)
    yPos += sectionSpacing
    // Table header
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    if (yPos > pageHeight - 20) {
      doc.addPage()
      yPos = 20
    }
    doc.text("Segment", margin, yPos)
    doc.text("Quantity", margin + 60, yPos)
    doc.text("Purpose", margin + 100, yPos)
    yPos += lineHeight * 1.5
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5)
    yPos += lineHeight

    // Table rows
    doc.setFont("helvetica", "normal")
    if (yPos > pageHeight - 20) {
      doc.addPage()
      yPos = 20
    }
    doc.text("Free users", margin, yPos)
    doc.text(allocationFree.toLocaleString(), margin + 60, yPos)
    doc.text("Test incremental conversion into paid subscriptions", margin + 100, yPos)
    yPos += lineHeight * 1.5
    if (yPos > pageHeight - 20) {
      doc.addPage()
      yPos = 20
    }
    doc.text("Paid users", margin, yPos)
    doc.text(allocationPaid.toLocaleString(), margin + 60, yPos)
    doc.text("Observe early renewal and engagement signals", margin + 100, yPos)
    yPos += sectionSpacing * 2

    addText("This allocation prioritizes growth signal clarity while limiting exposure during the pilot phase.", 11)
    yPos += sectionSpacing * 3

    // Plan choice
    addText("Plan choice", 18, true)
    yPos += sectionSpacing * 2

    addText(planName, 14, true)
    yPos += sectionSpacing
    if (planChoice === "growth_only") {
      addText("This pilot focuses primarily on incremental subscriber growth before attempting deeper retention optimization.", 11)
      yPos += sectionSpacing * 2
      addText("Why start with growth:", 11, true)
      yPos += sectionSpacing
      addBullet("Growth signals emerge faster and are easier to isolate", 11)
      addBullet("Retention effects are typically delayed and require longer observation windows", 11)
      addBullet("A growth-first pilot reduces interpretation ambiguity", 11)
      yPos += sectionSpacing
      addText("Retention optimization can be layered in after initial validation.", 11, true)
    } else {
      addText("This pilot focuses on maximizing net renewals while still growing paid subscribers.", 11)
      yPos += sectionSpacing
      addText(planRationale, 11)
    }
    yPos += sectionSpacing * 3

    // How the projection is calculated
    addText("How the projection is calculated (high-level)", 18, true)
    yPos += sectionSpacing * 2

    addText("The projected impact is derived from three factors only:", 11, true)
    yPos += sectionSpacing * 2

    addText("1. Incremental paid subscribers", 11, true)
    yPos += lineHeight
    addText("   Driven by NFC-enabled engagement and conversion behavior", 11)
    yPos += sectionSpacing * 2

    addText("2. Early signals of extended subscriber lifetime", 11, true)
    yPos += lineHeight
    addText("   Observed through repeat interaction and renewal-adjacent actions", 11)
    yPos += sectionSpacing * 2

    addText("3. Minus total program cost", 11, true)
    yPos += lineHeight
    addText("   Including magnet production and deployment", 11)
    yPos += sectionSpacing * 2

    addText("All other variables remain constant:", 11, true)
    yPos += sectionSpacing
    addBullet("Pricing", 11)
    addBullet("Billing cadence", 11)
    addBullet("Existing content strategy", 11)
    yPos += sectionSpacing
    addText("This keeps the pilot focused, measurable, and falsifiable.", 10, false, [100, 100, 100])
    yPos += sectionSpacing * 3

    // Timeline
    addText("Timeline: What happens after kickoff", 18, true)
    yPos += sectionSpacing * 2

    addText("Deployment timeline", 14, true)
    yPos += sectionSpacing

    const timelineSteps = [
      { title: "Kickoff", desc: "Confirm quantity, timeline, pricing, points of contact, and communication cadence." },
      { title: "Asset handoff", desc: "Brand assets and content source (link / RSS / page)." },
      { title: "Link & flow validation", desc: "NFC destination and subscription/payment flow validation." },
      { title: "Design approval", desc: "Final visuals and copy are frozen." },
      { title: "Sampling (deposit)", desc: "Sample production and shipment." },
      { title: "Sample acceptance", desc: "Approval or minor edits within acceptance criteria." },
      { title: "Mass production & shipping", desc: "" },
      { title: "Delivery & final payment", desc: "" },
    ]

    timelineSteps.forEach((step, index) => {
      if (timelineDates[index]) {
        addText(`${index + 1}. ${step.title} — ${timelineDates[index]}`, 11, true)
        if (step.desc) {
          yPos += lineHeight
          addText(`   ${step.desc}`, 11)
        }
        yPos += sectionSpacing
      }
    })
    yPos += sectionSpacing * 2

    // Measurement & review
    addText("Measurement & review", 18, true)
    yPos += sectionSpacing * 2

    addText("How success is evaluated", 14, true)
    yPos += sectionSpacing
    addText("This pilot is designed to generate directional clarity, not vanity metrics.", 11, true)
    yPos += sectionSpacing * 2

    addText("Signals reviewed include:", 11, true)
    yPos += sectionSpacing
    addBullet("NFC activation behavior", 11)
    addBullet("Return visits and follow-up actions", 11)
    addBullet("Subscription-adjacent events", 11)
    yPos += sectionSpacing * 2

    addText("Initial signals are reviewed after rollout to determine:", 11, true)
    yPos += sectionSpacing
    addBullet("Whether effects are observable", 11)
    addBullet("Whether adjustments are warranted", 11)
    addBullet("Whether a scaled deployment is justified", 11)
    yPos += sectionSpacing * 3

    // Incentive alignment & risk posture
    addText("Incentive alignment & risk posture", 18, true)
    yPos += sectionSpacing * 2

    addText("Incentive alignment", 14, true)
    yPos += sectionSpacing
    addText("FC benefits only when subscriber behavior improves.", 11, true)
    yPos += lineHeight
    addText("This pilot is structured so that incentives are aligned, not front-loaded.", 11)
    yPos += lineHeight
    addText("Commercial terms beyond the pilot are discussed after validation, not before.", 11)
    yPos += sectionSpacing * 2

    addText("Risk posture", 14, true)
    yPos += sectionSpacing
    addBullet("Outcomes may underperform projections", 11)
    addBullet("Effects may take longer than 12 months to materialize", 11)
    addBullet("This pilot is intentionally scoped to limit downside while preserving learning value", 11)
    yPos += sectionSpacing
    addText("The primary goal of this deployment is evidence, not certainty.", 10, false, [100, 100, 100])
    yPos += sectionSpacing * 3

    // Decision & next step
    addText("Decision & next step", 18, true)
    yPos += sectionSpacing * 2

    addText("If this approach aligns", 14, true)
    yPos += sectionSpacing
    addText("The next step is intentionally simple:", 11)
    yPos += sectionSpacing
    addBullet("Confirm pilot quantity", 11)
    addBullet("Confirm kickoff date", 11)
    yPos += sectionSpacing
    addText("No long-term commitment is required at this stage.", 11)
    yPos += sectionSpacing * 2
    addText("We're happy to walk through assumptions, methodology, or open questions before you decide.", 11)
    yPos += sectionSpacing * 3

    addText("Prepared by", 12, true)
    yPos += lineHeight
    addText("Fridge Channel (FC)", 12)

    return doc
  }

  const handleExportPDF = () => {
    const doc = generatePdfDoc()
    const pdfBlob = doc.output("blob")
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, "_blank")
  }

  const handleEmailToMe = async () => {
    if (!email) {
      toast.error("No email address found. Please go back and enter your email.")
      return
    }

    setIsSending(true)
    try {
      // Generate PDF
      const doc = generatePdfDoc()
      const pdfBase64 = doc.output("datauristring").split(",")[1] // Remove the "data:application/pdf;base64," prefix

      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          paidSubscribers,
          totalSubscribers,
          avgLifetimeMonths,
          arppuMonthlyUsd,
          planChoice,
          baselineMonthlyConversion, // Pass this to API
          creatorName: searchParams.get("creatorName"),
          pdfData: pdfBase64,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      toast.success("Email sent successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
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
                  <p>{effectiveHorizon / 12}-Year projection · base case · measured deployment</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              +${netGainUsd.toLocaleString()} / {effectiveHorizon === 12 ? "Year" : `${effectiveHorizon / 12} Years`}
            </div>
            <div className="text-xs text-muted-foreground">Estimated over {effectiveHorizon / 12} {effectiveHorizon === 12 ? "Year" : "Years"}, after all costs.</div>
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
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Button size="lg" onClick={handleExportPDF} variant="outline" className="sm:min-w-[200px]">
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button size="lg" onClick={handleEmailToMe} disabled={isSending} className="sm:min-w-[200px]">
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Email to me
              </>
            )}
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
