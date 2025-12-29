import { calculateRoi, DEFAULT_CONFIG, RoiInputs } from "../lib/roi";

// Mock console.log to keep output clean if needed, or just use it.
const log = console.log;

function runVerification() {
    log("=== ROI Engine Logic Verification ===");

    // Case 1: Standard inputs from spec/examples
    // M_total = 2000
    // P = 29 (approx) or let's use 30 for round numbers
    // L0 = 7 months
    // Inputs: Revenue = 800 * 29 = $23,200.
    // Recommendation logic would say 1500 total magnets.
    const inputs: RoiInputs = {
        totalMagnets: 1500,
        paidSubscribers: 800,
        freeSubscribers: 10000,
        arppuMonthlyUsd: 29,
        avgLifetimeMonths: 7,
        planChoice: "growth_only"
    };

    log("\n--- Test Case 1: Standard Growth Only ---");
    log("Inputs:", JSON.stringify(inputs, null, 2));

    const results = calculateRoi(inputs);

    // Check Allocation
    // Rule: Plan A (Growth Only) -> 100% Free, 0% Paid.
    // Recommended Size for $23k rev is 1500.
    const expectedAllocationPaid = 0;
    const expectedAllocationFree = 1500;

    log(`Allocation Check: Free=${results.allocation.free} (Exp: ${expectedAllocationFree}), Paid=${results.allocation.paid} (Exp: ${expectedAllocationPaid})`);
    if (results.allocation.free !== expectedAllocationFree || results.allocation.paid !== expectedAllocationPaid) {
        console.error("FAIL: Allocation mismatch");
    } else {
        log("PASS: Allocation logic");
    }

    // Check Track A: Growth
    // NewPaid = 1500 * 0.10 (default conversion) = 150
    // K = 29 * (1 - 0.10) * 0.8 = 29 * 0.9 * 0.8 = 20.88
    // Profit = 150 * (20.88 * 12) = 150 * 250.56 = 37584
    const expectedNewPaid = 150;
    const K = 29 * 0.9 * 0.8;
    const expectedGrowthProfit = 150 * (K * 12);

    log(`Growth Check: NewPaid=${results.growth.newPaidUsers} (Exp: ${expectedNewPaid})`);
    log(`Growth Profit: ${results.growth.profit12m.toFixed(2)} (Exp: ${expectedGrowthProfit.toFixed(2)})`);

    if (Math.abs(results.growth.profit12m - expectedGrowthProfit) > 0.1) {
        console.error("FAIL: Growth profit mismatch");
    } else {
        log("PASS: Growth calculations");
    }

    // Check Track B: Retention
    // Since Plan A has 0 Paid magnets, retention impact should be 0.
    const expectedExtraMonths = 0;
    const expectedRetentionProfit = 0;

    log(`Retention Check: ExtraMonths=${results.retention.extraUserMonths12m.toFixed(2)} (Exp: ${expectedExtraMonths.toFixed(2)})`);
    log(`Retention Profit: ${results.retention.profit12m.toFixed(2)} (Exp: ${expectedRetentionProfit.toFixed(2)})`);

    if (Math.abs(results.retention.profit12m - expectedRetentionProfit) > 0.1) {
        console.error("FAIL: Retention profit mismatch");
    } else {
        log("PASS: Retention calculations");
    }

    // Check Totals
    const pilotCost = 1500 * 20; // 30000
    const totalProfit = expectedGrowthProfit + expectedRetentionProfit;
    const netGain = totalProfit - pilotCost;

    log(`Total ROI Check: NetGain=${results.total.netGain12m.toFixed(2)} (Exp: ${netGain.toFixed(2)})`);
    if (Math.abs(results.total.netGain12m - netGain) > 0.1) {
        console.error("FAIL: Net gain mismatch");
    } else {
        log("PASS: Total calculations");
    }

    log("\n=== verification complete ===");
}

runVerification();
