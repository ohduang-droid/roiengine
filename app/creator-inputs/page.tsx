"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const formSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    paidSubscribers: z.coerce.number().min(0, "Must be 0 or greater"),
    totalSubscribers: z.coerce.number().min(0, "Must be 0 or greater"),
    avgLifetimeMonths: z.coerce.number().min(1, "Must be at least 1 month"),
    avgRevenuePerSubscriber: z.coerce.number().min(0, "Must be 0 or greater"),
    planChoice: z.enum(["growth_only", "growth_and_retention"], {
      required_error: "Please select a plan",
    }),
    // Conditional fields
    newPaidPerMonth: z.coerce.number().min(0, "Must be 0 or greater"),
    dropoffPeakWindow: z.enum(["month_1", "month_2", "month_3", "month_4_6", "not_sure"]).optional(),
  })
  .refine((data) => data.totalSubscribers >= data.paidSubscribers, {
    message: "Total subscribers must be greater than or equal to paid subscribers",
    path: ["totalSubscribers"],
  })
  .refine(
    (data) => {
      if (data.planChoice === "growth_and_retention") {
        return data.dropoffPeakWindow !== undefined
      }
      return true
    },
    {
      message: "This field is required for Plan B",
      path: ["dropoffPeakWindow"],
    },
  )
  .refine(
    (data) => {
      return data.newPaidPerMonth !== undefined && data.newPaidPerMonth >= 0
    },
    {
      message: "This field is required",
      path: ["newPaidPerMonth"],
    },
  )

type FormData = z.infer<typeof formSchema>

export default function CreatorInputsPage() {
  const router = useRouter()
  const [planChoice, setPlanChoice] = useState<"growth_only" | "growth_and_retention" | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
  })

  // Watch form values for the summary
  const watchedValues = watch()
  const freeSubscribers = (watchedValues.totalSubscribers || 0) - (watchedValues.paidSubscribers || 0)

  const handlePlanChange = (value: string) => {
    const newPlan = value as "growth_only" | "growth_and_retention"
    setPlanChoice(newPlan)
    setValue("planChoice", newPlan)
  }

  const onSubmit = (data: FormData) => {
    const payload = {
      email: data.email,
      paid_subscribers_est: data.paidSubscribers,
      total_subscribers_est: data.totalSubscribers,
      free_subscribers_est: data.totalSubscribers - data.paidSubscribers,
      baseline_avg_paid_lifetime_months_L0: data.avgLifetimeMonths,
      price_month_equiv_usd: data.avgRevenuePerSubscriber,
      plan_choice: data.planChoice,
      ...(data.planChoice === "growth_only" && {
        growth_baseline_new_paid_per_month: data.newPaidPerMonth,
      }),
      ...(data.planChoice === "growth_and_retention" && {
        dropoff_peak_window: data.dropoffPeakWindow,
      }),
    }

    console.log("[v0] Form submitted with payload:", payload)

    const params = new URLSearchParams({
      email: data.email,
      paidSubscribers: data.paidSubscribers.toString(),
      totalSubscribers: data.totalSubscribers.toString(),
      avgLifetimeMonths: data.avgLifetimeMonths.toString(),
      arppuMonthlyUsd: data.avgRevenuePerSubscriber.toString(),
      planChoice: data.planChoice,
    })

    router.push(`/deploy-plan?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-12 space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">FC ROI Calculator</h1>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This takes ~3 minutes.</p>
            <p className="text-sm text-muted-foreground">
              We'll use your inputs to estimate potential ROI. You can answer approximately — ranges are OK.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          {/* Q0: Email */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Q1. What's the best email to reach you?
              </Label>
              <Input id="email" type="email" {...register("email")} className="h-11" aria-invalid={!!errors.email} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              <p className="text-sm text-muted-foreground">We'll only use this to send your ROI results.</p>
            </div>
          </div>

          {/* Section: Your baseline */}
          <div className="space-y-8">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Your baseline</h2>
            </div>

            {/* Q1: Paid subscribers */}
            <div className="space-y-2">
              <Label htmlFor="paidSubscribers" className="text-base font-medium">
                Q2. How many paid subscribers do you have? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="paidSubscribers"
                type="number"
                placeholder="800"
                {...register("paidSubscribers")}
                className="h-11"
                aria-invalid={!!errors.paidSubscribers}
              />
              {errors.paidSubscribers && <p className="text-sm text-destructive">{errors.paidSubscribers.message}</p>}
            </div>

            {/* Q2: Total subscribers */}
            <div className="space-y-2">
              <Label htmlFor="totalSubscribers" className="text-base font-medium">
                Q3. What is your total number of subscribers? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="totalSubscribers"
                type="number"
                placeholder="12000"
                {...register("totalSubscribers")}
                className="h-11"
                aria-invalid={!!errors.totalSubscribers}
              />
              {errors.totalSubscribers && <p className="text-sm text-destructive">{errors.totalSubscribers.message}</p>}
              <p className="text-sm text-muted-foreground">We'll estimate your free subscribers as: total − paid.</p>
            </div>

            {/* Q4: New paid subscribers per month (optional) */}
            <div className="space-y-2">
              <Label htmlFor="newPaidPerMonth" className="text-base font-medium">
                Q4. What is your average number of new paid subscribers per month? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPaidPerMonth"
                type="number"
                placeholder="120"
                {...register("newPaidPerMonth")}
                className="h-11"
                aria-invalid={!!errors.newPaidPerMonth}
              />
              {errors.newPaidPerMonth && <p className="text-sm text-destructive">{errors.newPaidPerMonth.message}</p>}
            </div>

            {/* Q5: Lifetime months */}
            <div className="space-y-2">
              <Label htmlFor="avgLifetimeMonths" className="text-base font-medium">
                Q5. How many months does a paid subscriber stay on average? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="avgLifetimeMonths"
                type="number"
                step="0.1"
                placeholder="7"
                {...register("avgLifetimeMonths")}
                className="h-11"
                aria-invalid={!!errors.avgLifetimeMonths}
              />
              {errors.avgLifetimeMonths && (
                <p className="text-sm text-destructive">{errors.avgLifetimeMonths.message}</p>
              )}
            </div>

            {/* Q6: Revenue per subscriber */}
            <div className="space-y-2">
              <Label htmlFor="avgRevenuePerSubscriber" className="text-base font-medium">
                Q6. What is your average monthly revenue per paid subscriber? (USD){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="avgRevenuePerSubscriber"
                type="number"
                step="0.01"
                placeholder="29"
                {...register("avgRevenuePerSubscriber")}
                className="h-11"
                aria-invalid={!!errors.avgRevenuePerSubscriber}
              />
              {errors.avgRevenuePerSubscriber && (
                <p className="text-sm text-destructive">{errors.avgRevenuePerSubscriber.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                If you have annual plans, enter the monthly equivalent (annual price ÷ 12).
              </p>
            </div>
          </div>

          {/* Section: Your goal */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Your goal</h2>
            </div>

            {/* Q7: Plan choice */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q7. Which outcome do you want to improve most? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup onValueChange={handlePlanChange} className="space-y-3">
                {/* Plan A */}
                <label
                  htmlFor="plan-a"
                  className="flex cursor-pointer items-start gap-4"
                >
                  <RadioGroupItem value="growth_only" id="plan-a" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="text-lg font-bold">Plan A — Growth Only</div>
                    <div className="text-base text-muted-foreground">
                      Turn more free subscribers into paid (New Paid).
                    </div>
                  </div>
                </label>

                {/* Plan B */}
                <label
                  htmlFor="plan-b"
                  className="flex cursor-pointer items-start gap-4"
                >
                  <RadioGroupItem value="growth_and_retention" id="plan-b" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="text-lg font-bold">Plan B — Growth + Retention</div>
                    <div className="text-base text-muted-foreground">
                      Improve growth and retention together; we'll recommend an allocation.
                    </div>
                  </div>
                </label>
              </RadioGroup>
              {errors.planChoice && <p className="text-sm text-destructive">{errors.planChoice.message}</p>}
            </div>
          </div>

          {/* Conditional Section: Plan B */}
          {planChoice === "growth_and_retention" && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Q8. Around which month do subscribers usually cancel? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                onValueChange={(value) => setValue("dropoffPeakWindow", value as any)}
                className="space-y-2"
              >
                <label
                  htmlFor="month-1"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-all hover:bg-accent"
                >
                  <RadioGroupItem value="month_1" id="month-1" />
                  <span>Month 1</span>
                </label>
                <label
                  htmlFor="month-2"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-all hover:bg-accent"
                >
                  <RadioGroupItem value="month_2" id="month-2" />
                  <span>Month 2</span>
                </label>
                <label
                  htmlFor="month-3"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-all hover:bg-accent"
                >
                  <RadioGroupItem value="month_3" id="month-3" />
                  <span>Month 3</span>
                </label>
                <label
                  htmlFor="month-4-6"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-all hover:bg-accent"
                >
                  <RadioGroupItem value="month_4_6" id="month-4-6" />
                  <span>Month 4–6</span>
                </label>
                <label
                  htmlFor="not-sure"
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-all hover:bg-accent"
                >
                  <RadioGroupItem value="not_sure" id="not-sure" />
                  <span>Not sure</span>
                </label>
              </RadioGroup>
              {errors.dropoffPeakWindow && (
                <p className="text-sm text-destructive">{errors.dropoffPeakWindow.message}</p>
              )}
              <p className="text-sm text-muted-foreground">If you're not sure, choose "Not sure".</p>
            </div>
          )}

          {/* Review Summary */}
          {watchedValues.paidSubscribers && watchedValues.totalSubscribers && (
            <div className="space-y-3 rounded-lg bg-muted/30 p-6">
              <h3 className="text-sm font-medium text-muted-foreground">Review summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid subscribers:</span>
                  <span className="font-medium">{watchedValues.paidSubscribers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total subscribers:</span>
                  <span className="font-medium">{watchedValues.totalSubscribers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated free subscribers:</span>
                  <span className="font-medium">{Math.max(0, freeSubscribers).toLocaleString()}</span>
                </div>
                {planChoice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium">
                      {planChoice === "growth_only" ? "Plan A — Growth Only" : "Plan B — Growth + Retention"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button type="submit" size="lg" className="min-w-[200px] text-base font-medium">
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
