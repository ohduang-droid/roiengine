import { calculateRoi, RoiInputs, DEFAULT_CONFIG } from "../lib/roi";

// Mock log
const log = console.log;

function runDebug() {
    log("=== ROI Break-Even Analysis ===");
    log(`Cost/Magnet: $${DEFAULT_CONFIG.costPerMagnetUsd}`);
    log(`Conversion Rate: ${DEFAULT_CONFIG.conversionRateGrowth}`);
    log(`Churn Improvement: ${DEFAULT_CONFIG.churnImprovement}`);

    const scenarios = [
        { arppu: 15, name: "Low ARPU ($15)" },
        { arppu: 20, name: "Mid-Low ARPU ($20)" },
        { arppu: 23, name: "Break-Even Cand ($23)" },
        { arppu: 24, name: "Break-Even Cand ($24)" },
        { arppu: 29, name: "Default ($29)" },
        { arppu: 50, name: "Premium ($50)" }
    ];

    log("\n--- Plan A: Growth Only (100% Free) ---");
    // 1500 magnets
    const inputsBase: RoiInputs = {
        totalMagnets: 1500,
        paidSubscribers: 800,
        freeSubscribers: 10000,
        avgLifetimeMonths: 7,
        arppuMonthlyUsd: 0, // Placeholder
        planChoice: "growth_only"
    };

    scenarios.forEach(s => {
        const inputs = { ...inputsBase, arppuMonthlyUsd: s.arppu };
        const res = calculateRoi(inputs);
        log(`${s.name}: Profit=$${res.total.netGain12m.toFixed(0)} (Revenue=$${res.growth.revenue12m.toFixed(0)})`);
    });

    log("\n--- Plan B: Growth + Retention (1275 Free / 225 Paid) ---");
    scenarios.forEach(s => {
        const inputs = { ...inputsBase, arppuMonthlyUsd: s.arppu, planChoice: "growth_and_retention" as const };
        const res = calculateRoi(inputs);
        log(`${s.name}: Profit=$${res.total.netGain12m.toFixed(0)}`);
    });
}

runDebug();
