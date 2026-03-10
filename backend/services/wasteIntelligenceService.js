/**
 * Waste Intelligence Service
 *
 * Analyzes plate-level waste data:
 *   - Category breakdown (cooked excess vs served-untouched vs partial vs spoilage)
 *   - Root cause analysis per dish
 *   - Trend analysis over time
 *   - Actionable insights
 */

import WasteClassification from "../models/WasteClassification.js";
import MealData from "../models/MealData.js";

function dateDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
}

/**
 * Get overall waste breakdown by category over last N days.
 */
export async function getCategoryBreakdown(days = 14) {
    const since = dateDaysAgo(days);

    const agg = await WasteClassification.aggregate([
        { $match: { date: { $gte: since } } },
        {
            $group: {
                _id: null,
                cookedExcess: { $sum: "$cookedExcess" },
                servedUntouched: { $sum: "$servedUntouched" },
                partiallyEaten: { $sum: "$partiallyEaten" },
                spoilage: { $sum: "$spoilage" },
                totalWaste: { $sum: "$totalWaste" },
                entries: { $sum: 1 },
            },
        },
    ]);

    const data = agg[0] || { cookedExcess: 0, servedUntouched: 0, partiallyEaten: 0, spoilage: 0, totalWaste: 0, entries: 0 };
    const total = data.totalWaste || 1;

    return {
        total: parseFloat(data.totalWaste.toFixed(1)),
        entries: data.entries,
        categories: [
            { name: "Cooked Excess", key: "cookedExcess", value: parseFloat(data.cookedExcess.toFixed(1)), pct: parseFloat(((data.cookedExcess / total) * 100).toFixed(1)), color: "#ef4444", icon: "🍳", cause: "Kitchen over-production" },
            { name: "Served Untouched", key: "servedUntouched", value: parseFloat(data.servedUntouched.toFixed(1)), pct: parseFloat(((data.servedUntouched / total) * 100).toFixed(1)), color: "#f59e0b", icon: "🍽️", cause: "Portion mismatch" },
            { name: "Partially Eaten", key: "partiallyEaten", value: parseFloat(data.partiallyEaten.toFixed(1)), pct: parseFloat(((data.partiallyEaten / total) * 100).toFixed(1)), color: "#8b5cf6", icon: "😒", cause: "Taste or quality issue" },
            { name: "Spoilage", key: "spoilage", value: parseFloat(data.spoilage.toFixed(1)), pct: parseFloat(((data.spoilage / total) * 100).toFixed(1)), color: "#64748b", icon: "🦠", cause: "Freshness / storage issue" },
        ],
    };
}

/**
 * Get per-dish root cause analysis.
 */
export async function getDishAnalysis(days = 14) {
    const since = dateDaysAgo(days);

    const agg = await WasteClassification.aggregate([
        { $match: { date: { $gte: since } } },
        {
            $group: {
                _id: "$dish",
                cookedExcess: { $sum: "$cookedExcess" },
                servedUntouched: { $sum: "$servedUntouched" },
                partiallyEaten: { $sum: "$partiallyEaten" },
                spoilage: { $sum: "$spoilage" },
                totalWaste: { $sum: "$totalWaste" },
                entries: { $sum: 1 },
            },
        },
        { $sort: { totalWaste: -1 } },
        { $limit: 10 },
    ]);

    return agg.map(d => {
        const total = d.totalWaste || 1;
        const categories = [
            { name: "Cooked Excess", value: d.cookedExcess, pct: parseFloat(((d.cookedExcess / total) * 100).toFixed(0)) },
            { name: "Untouched", value: d.servedUntouched, pct: parseFloat(((d.servedUntouched / total) * 100).toFixed(0)) },
            { name: "Partial", value: d.partiallyEaten, pct: parseFloat(((d.partiallyEaten / total) * 100).toFixed(0)) },
            { name: "Spoilage", value: d.spoilage, pct: parseFloat(((d.spoilage / total) * 100).toFixed(0)) },
        ];
        const primary = categories.reduce((a, b) => a.value > b.value ? a : b);
        return {
            dish: d._id,
            totalWaste: parseFloat(d.totalWaste.toFixed(1)),
            entries: d.entries,
            primaryCause: primary.name,
            categories,
        };
    });
}

/**
 * Get waste trend by day for the last N days.
 */
export async function getWasteTrend(days = 14) {
    const since = dateDaysAgo(days);

    const agg = await WasteClassification.aggregate([
        { $match: { date: { $gte: since } } },
        {
            $group: {
                _id: "$date",
                cookedExcess: { $sum: "$cookedExcess" },
                servedUntouched: { $sum: "$servedUntouched" },
                partiallyEaten: { $sum: "$partiallyEaten" },
                spoilage: { $sum: "$spoilage" },
                totalWaste: { $sum: "$totalWaste" },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return agg.map(d => ({
        date: d._id,
        total: parseFloat(d.totalWaste.toFixed(1)),
        cookedExcess: parseFloat(d.cookedExcess.toFixed(1)),
        servedUntouched: parseFloat(d.servedUntouched.toFixed(1)),
        partiallyEaten: parseFloat(d.partiallyEaten.toFixed(1)),
        spoilage: parseFloat(d.spoilage.toFixed(1)),
    }));
}

/**
 * Generate waste insights based on classified data.
 */
export async function getWasteInsights() {
    const breakdown = await getCategoryBreakdown(14);
    const dishes = await getDishAnalysis(14);
    const insights = [];

    // Find dominant waste category
    const dominant = breakdown.categories.reduce((a, b) => a.value > b.value ? a : b);
    if (dominant.value > 0) {
        insights.push({
            severity: "high",
            icon: dominant.icon,
            message: `${dominant.name} is the #1 waste category (${dominant.pct}%). Root cause: ${dominant.cause}.`,
        });
    }

    // Top wasting dish
    if (dishes.length > 0) {
        const top = dishes[0];
        insights.push({
            severity: "high",
            icon: "📊",
            message: `${top.dish} is the most wasted dish (${top.totalWaste} kg). Primary cause: ${top.primaryCause}.`,
        });
    }

    // Spoilage alert
    const spoilage = breakdown.categories.find(c => c.key === "spoilage");
    if (spoilage && spoilage.pct > 20) {
        insights.push({
            severity: "critical",
            icon: "🦠",
            message: `Spoilage accounts for ${spoilage.pct}% of waste — review storage conditions and supply chain freshness.`,
        });
    }

    if (insights.length === 0) {
        insights.push({
            severity: "info",
            icon: "📋",
            message: "No waste classification data yet. Use the form below to log detailed waste breakdowns.",
        });
    }

    return { breakdown, dishes, insights };
}
