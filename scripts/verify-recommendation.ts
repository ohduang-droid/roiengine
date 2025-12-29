import { recommendPilotSize, RoiInputs, DEFAULT_CONFIG, calculateRoi } from "../lib/roi";

// Mock console.log
const log = console.log;

function runVerification() {
    log("=== Revenue-Based Recommendation Verification ===");
    log(`Config Cost Check: $${DEFAULT_CONFIG.costPerMagnetUsd} (Expected: $20)`);

    if (DEFAULT_CONFIG.costPerMagnetUsd !== 20) {
        console.error("FAIL: Default cost should be $20");
    } else {
        log("PASS: Default cost is $20");
    }

    // Test Case 1: Low Revenue (< $40k)
    // 800 paid * $29 = $23,200
    // Expect: 1500 magnets ($30k cost) - The Minimum Entry Ticket
    const inputsLow: RoiInputs = {
        totalMagnets: 0,
        paidSubscribers: 800,
        freeSubscribers: 10000,
        arppuMonthlyUsd: 29,
        avgLifetimeMonths: 7,
        planChoice: "growth_only"
    };
    const recLow = recommendPilotSize(inputsLow);
    log(`\nTest Case 1 (Rev $23,200): Recommended=${recLow} (Exp: 1500)`);
    if (recLow !== 1500) console.error("FAIL: Should be 1500");
    else log("PASS");


    // Test Case 2: Mid Revenue ($40k - $80k)
    // 2000 paid * $29 = $58,000
    // Expect: 2000 magnets ($40k cost) - The Standard Batch
    const inputsMid: RoiInputs = {
        ...inputsLow,
        paidSubscribers: 2000
    };
    const recMid = recommendPilotSize(inputsMid);
    log(`\nTest Case 2 (Rev $58,000): Recommended=${recMid} (Exp: 2000)`);
    if (recMid !== 2000) console.error("FAIL: Should be 2000");
    else log("PASS");


    // Test Case 3: High Revenue (> $80k)
    // 5000 paid * $29 = $145,000
    // Expect: 3000 magnets ($60k cost) - The Premium Batch
    const inputsHigh: RoiInputs = {
        ...inputsLow,
        paidSubscribers: 5000
    };
    const recHigh = recommendPilotSize(inputsHigh);
    log(`\nTest Case 3 (Rev $145,000): Recommended=${recHigh} (Exp: 3000)`);
    if (recHigh !== 3000) console.error("FAIL: Should be 3000");
    else log("PASS");

    log("\n=== specific ROI Calculation Check ===");
    // Verify that passing 0 totalMagnets but then updating it works as expected (simulating frontend)
    const inputsReal = { ...inputsMid };
    inputsReal.totalMagnets = recMid;
    const results = calculateRoi(inputsReal);

    log(`Results for Mid Case (2000 magnets): Pilot Cost=$${results.total.pilotCost}`);
    if (results.total.pilotCost !== 40000) console.error("FAIL: Pilot cost should be 2000 * 20 = 40000");
    else log("PASS: Pilot cost calculation correct");
}

runVerification();
