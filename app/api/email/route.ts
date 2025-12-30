
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { calculateRoi, RoiInputs, DEFAULT_CONFIG } from '@/lib/roi';

const DEPLOYMENT_MAGNETS_M = 2000;

export async function POST(req: Request) {
    try {
        const {
            email,
            paidSubscribers,
            totalSubscribers,
            avgLifetimeMonths,
            arppuMonthlyUsd,
            planChoice,
            baselineMonthlyConversion, // Optional
            creatorName, // Optional
            pdfData // Optional base64 string
        } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const freeSubscribers = Math.max(0, totalSubscribers - paidSubscribers);

        const roiInputs: RoiInputs = {
            totalMagnets: DEPLOYMENT_MAGNETS_M,
            paidSubscribers,
            freeSubscribers,
            arppuMonthlyUsd,
            avgLifetimeMonths,
            planChoice,
            baselineMonthlyConversion,
        };

        // Calculate ROI (logic mirrored from page.tsx)
        // 1. Try 12 months
        let effectiveHorizon = 12;
        let roiResults = calculateRoi(roiInputs, { ...DEFAULT_CONFIG, horizonMonths: 12 });

        // 2. If negative, try 24 or 36
        if (roiResults.total.netGain12m < 0) {
            const pb = roiResults.total.paybackMonths;
            if (pb > 0 && pb <= 24) {
                effectiveHorizon = 24;
            } else {
                effectiveHorizon = 36;
            }
            roiResults = calculateRoi(roiInputs, { ...DEFAULT_CONFIG, horizonMonths: effectiveHorizon });
        }

        const {
            total: { pilotCost: upfrontCostUsd, netGain12m: netGainUsd, paybackMonths },
        } = roiResults;

        const planName = planChoice === "growth_only" ? "Plan A — Growth Only" : "Plan B — Growth + Retention";
        const emailName = creatorName || email.split('@')[0];

        // Email content
        // New Title: Your FC Deployment Plan & ROI Summary
        // New Body:
        // Hi {{邮件前缀}},
        // Please find attached your FC Deployment Plan & ROI Summary based on your current subscription model.
        // This document outlines:
        // Expected impact on growth & retention
        // Recommended magnet allocation strategy
        // Estimated ROI and payback logic
        // Happy to walk through it together if helpful.
        // Best,
        // Fridge Channel 

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Hi ${emailName},</p>
        
        <p>Please find attached your FC Deployment Plan & ROI Summary based on your current subscription model.</p>
        
        <p>This document outlines:</p>
        <ul>
            <li>Expected impact on growth & retention</li>
            <li>Recommended magnet allocation strategy</li>
            <li>Estimated ROI and payback logic</li>
        </ul>
        
        <p>Happy to walk through it together if helpful.</p>
        
        <p>Best,<br>Fridge Channel</p>
      </div>
    `;

        // Transporter setup
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const mailOptions: any = {
            from: `"Fridge Channel ROI" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `Your FC Deployment Plan & ROI Summary`,
            html: htmlContent,
        };

        if (pdfData) {
            mailOptions.attachments = [
                {
                    filename: 'FC_Deployment_Plan.pdf',
                    content: pdfData,
                    encoding: 'base64',
                },
            ];
        }

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
