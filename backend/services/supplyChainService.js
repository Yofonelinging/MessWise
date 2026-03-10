/**
 * Supply Chain Service
 *
 * Tracks supplier performance and generates procurement insights:
 *   - Supplier reliability scoring
 *   - Quality trend tracking
 *   - Rejection rate analysis
 *   - Procurement recommendations
 */

import SupplierFeedback from "../models/SupplierFeedback.js";

function dateDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
}

/**
 * Get supplier scorecards (aggregated performance).
 */
export async function getSupplierScorecards(days = 30) {
    const since = dateDaysAgo(days);

    const agg = await SupplierFeedback.aggregate([
        { $match: { date: { $gte: since } } },
        {
            $group: {
                _id: "$supplierName",
                avgQuality: { $avg: "$qualityScore" },
                avgFreshness: { $avg: "$freshnessScore" },
                avgDelivery: { $avg: "$deliveryScore" },
                avgOverall: { $avg: "$overallScore" },
                totalOrdered: { $sum: "$orderedQty" },
                totalReceived: { $sum: "$receivedQty" },
                totalRejected: { $sum: "$rejectedQty" },
                deliveries: { $sum: 1 },
                categories: { $addToSet: "$category" },
            },
        },
        { $sort: { avgOverall: -1 } },
    ]);

    return agg.map(s => {
        const rejectionRate = s.totalOrdered > 0
            ? parseFloat(((s.totalRejected / s.totalOrdered) * 100).toFixed(1))
            : 0;
        const fulfillmentRate = s.totalOrdered > 0
            ? parseFloat(((s.totalReceived / s.totalOrdered) * 100).toFixed(1))
            : 100;
        const status = s.avgOverall >= 4 ? "excellent" : s.avgOverall >= 3 ? "good" : s.avgOverall >= 2.5 ? "fair" : "poor";

        return {
            supplier: s._id,
            avgQuality: parseFloat(s.avgQuality.toFixed(1)),
            avgFreshness: parseFloat(s.avgFreshness.toFixed(1)),
            avgDelivery: parseFloat(s.avgDelivery.toFixed(1)),
            avgOverall: parseFloat(s.avgOverall.toFixed(1)),
            deliveries: s.deliveries,
            rejectionRate,
            fulfillmentRate,
            categories: s.categories,
            status,
        };
    });
}

/**
 * Generate supply chain insights.
 */
export async function getSupplyChainInsights() {
    const scorecards = await getSupplierScorecards(30);
    const insights = [];

    // Poor performers
    const poor = scorecards.filter(s => s.status === "poor");
    for (const s of poor) {
        insights.push({
            severity: "critical",
            icon: "🚨",
            message: `${s.supplier} has a poor overall score (${s.avgOverall}/5). Consider finding an alternative supplier.`,
        });
    }

    // High rejection rates
    const highRejection = scorecards.filter(s => s.rejectionRate > 10);
    for (const s of highRejection) {
        insights.push({
            severity: "warning",
            icon: "📦",
            message: `${s.supplier} rejection rate: ${s.rejectionRate}% — investigate quality issues.`,
        });
    }

    // Low freshness
    const lowFresh = scorecards.filter(s => s.avgFreshness < 3);
    for (const s of lowFresh) {
        insights.push({
            severity: "warning",
            icon: "🥬",
            message: `${s.supplier} freshness score: ${s.avgFreshness}/5 — contributing to spoilage waste.`,
        });
    }

    // Excellent performers
    const excellent = scorecards.filter(s => s.status === "excellent");
    for (const s of excellent.slice(0, 2)) {
        insights.push({
            severity: "info",
            icon: "⭐",
            message: `${s.supplier} is a top performer (${s.avgOverall}/5). Consider increasing order volume.`,
        });
    }

    if (insights.length === 0 && scorecards.length === 0) {
        insights.push({
            severity: "info",
            icon: "📋",
            message: "No supplier data yet. Log deliveries using the form below to track performance.",
        });
    }

    const summary = {
        totalSuppliers: scorecards.length,
        avgQuality: scorecards.length ? parseFloat((scorecards.reduce((a, s) => a + s.avgQuality, 0) / scorecards.length).toFixed(1)) : 0,
        totalDeliveries: scorecards.reduce((a, s) => a + s.deliveries, 0),
        avgRejectionRate: scorecards.length ? parseFloat((scorecards.reduce((a, s) => a + s.rejectionRate, 0) / scorecards.length).toFixed(1)) : 0,
    };

    return { scorecards, insights, summary };
}
