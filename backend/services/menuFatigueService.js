/**
 * Menu Fatigue Service
 *
 * Calculates a "fatigue score" (0–100) for each dish based on:
 *   1. Repeat frequency in the last 14 days
 *   2. Declining attendance trend when the dish is served
 *   3. Rising waste % for the same dish over time
 *   4. Average rating decline over recent servings
 *
 * A higher score → more fatigued → should be replaced.
 */

import MealData from "../models/MealData.js";
import Menu from "../models/Menu.js";
import Rating from "../models/Rating.js";

function dateDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
}

// ── Individual scoring helpers ─────────────────────────────

/**
 * Repeat frequency score (0–40).
 * More repeats in 14 days → higher fatigue.
 */
function repeatScore(repeatCount) {
    // 1 appearance = 0, 7+ = 40
    if (repeatCount <= 1) return 0;
    return Math.min(40, (repeatCount - 1) * 7);
}

/**
 * Waste trend score (0–25).
 * If waste % is rising over recent servings, fatigue is kicking in.
 */
function wasteTrendScore(wasteRecords) {
    if (wasteRecords.length < 2) return 0;

    // Compare first-half avg waste% to second-half avg waste%
    const mid = Math.floor(wasteRecords.length / 2);
    const first = wasteRecords.slice(0, mid);
    const second = wasteRecords.slice(mid);

    const avgFirst = first.reduce((s, r) => s + r.wastePct, 0) / first.length;
    const avgSecond = second.reduce((s, r) => s + r.wastePct, 0) / second.length;

    const rise = avgSecond - avgFirst;
    if (rise <= 0) return 0;
    // Each 5% rise in waste contributes ~10 fatigue points, max 25
    return Math.min(25, Math.round(rise * 2));
}

/**
 * Rating decline score (0–20).
 * If average rating is dropping, students are losing interest.
 */
function ratingDeclineScore(ratings) {
    if (ratings.length < 2) return 0;

    const mid = Math.floor(ratings.length / 2);
    const first = ratings.slice(0, mid);
    const second = ratings.slice(mid);

    const avgFirst = first.reduce((s, r) => s + r.rating, 0) / first.length;
    const avgSecond = second.reduce((s, r) => s + r.rating, 0) / second.length;

    const drop = avgFirst - avgSecond; // positive if declining
    if (drop <= 0) return 0;
    // Each 0.5 star drop = ~10 fatigue, max 20
    return Math.min(20, Math.round(drop * 20));
}

/**
 * Overall waste level score (0–15).
 * Dishes with consistently high waste are likely fatigued.
 */
function highWasteScore(wasteRecords) {
    if (wasteRecords.length === 0) return 0;
    const avgWaste = wasteRecords.reduce((s, r) => s + r.wastePct, 0) / wasteRecords.length;
    if (avgWaste < 10) return 0;
    if (avgWaste < 20) return 5;
    if (avgWaste < 35) return 10;
    return 15;
}

// ── Main API ───────────────────────────────────────────────

/**
 * Returns fatigue scores for all dishes that appeared in the last 14 days.
 */
export async function getFatigueScores() {
    const since14 = dateDaysAgo(14);
    const since30 = dateDaysAgo(30);

    // 1. Find all dishes in menus from last 14 days
    const recentMenus = await Menu.find({ date: { $gte: since14 } });
    const dishSet = new Set();
    for (const m of recentMenus) {
        [...(m.breakfast || []), ...(m.lunch || []), ...(m.dinner || [])].forEach(d => dishSet.add(d));
    }

    // Also include dishes from MealData in case menu wasn't set
    const recentMealData = await MealData.find({ date: { $gte: since14 } });
    recentMealData.forEach(r => dishSet.add(r.dish));

    if (dishSet.size === 0) return [];

    // 2. For each dish, compute scores
    const results = [];

    for (const dish of dishSet) {
        // Count repeats in menus
        let menuRepeatCount = 0;
        for (const m of recentMenus) {
            const all = [...(m.breakfast || []), ...(m.lunch || []), ...(m.dinner || [])];
            if (all.some(i => i.toLowerCase() === dish.toLowerCase())) menuRepeatCount++;
        }

        // Get waste records for this dish (last 30 days for trend analysis)
        const wasteRecords = await MealData.find({
            dish: { $regex: new RegExp(`^${dish}$`, "i") },
            date: { $gte: since30 },
        }).sort({ date: 1 });

        // Get ratings for this dish (last 30 days)
        const ratings = await Rating.find({
            dish: { $regex: new RegExp(`^${dish}$`, "i") },
            date: { $gte: since30 },
        }).sort({ date: 1 });

        // Compute individual scores
        const repeat = repeatScore(menuRepeatCount);
        const wasteTrnd = wasteTrendScore(wasteRecords);
        const ratingDcl = ratingDeclineScore(ratings);
        const highWaste = highWasteScore(wasteRecords);

        const totalScore = Math.min(100, repeat + wasteTrnd + ratingDcl + highWaste);

        const avgRating = ratings.length > 0
            ? parseFloat((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1))
            : null;

        const avgWastePct = wasteRecords.length > 0
            ? parseFloat((wasteRecords.reduce((s, r) => s + r.wastePct, 0) / wasteRecords.length).toFixed(1))
            : null;

        results.push({
            dish,
            fatigueScore: totalScore,
            breakdown: { repeat, wasteTrend: wasteTrnd, ratingDecline: ratingDcl, highWaste },
            repeatsIn14Days: menuRepeatCount,
            avgRating,
            avgWastePct,
            dataPoints: wasteRecords.length,
            status: totalScore >= 60 ? "critical" : totalScore >= 35 ? "warning" : "healthy",
        });
    }

    // Sort by fatigue score descending
    results.sort((a, b) => b.fatigueScore - a.fatigueScore);

    return results;
}

/**
 * Returns replacement suggestions for fatigued dishes.
 * Suggests dishes that haven't been served recently and have good ratings.
 */
export async function getReplacementSuggestions() {
    const since14 = dateDaysAgo(14);
    const since60 = dateDaysAgo(60);

    // Find dishes served in last 14 days
    const recentDishes = new Set();
    const recentMenus = await Menu.find({ date: { $gte: since14 } });
    for (const m of recentMenus) {
        [...(m.breakfast || []), ...(m.lunch || []), ...(m.dinner || [])].forEach(d => recentDishes.add(d.toLowerCase()));
    }

    // Find all historically served dishes (60 days) with good ratings
    const historicalDishes = await Rating.aggregate([
        { $match: { date: { $gte: since60 } } },
        { $group: { _id: "$dish", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
        { $match: { avgRating: { $gte: 3.5 } } },
        { $sort: { avgRating: -1 } },
    ]);

    // Filter out dishes served recently
    const suggestions = historicalDishes
        .filter(d => !recentDishes.has(d._id.toLowerCase()))
        .map(d => ({
            dish: d._id,
            avgRating: parseFloat(d.avgRating.toFixed(1)),
            timesRated: d.count,
            reason: "Not served recently, good student ratings",
        }));

    // If no rating-based suggestions, suggest from MealData
    if (suggestions.length === 0) {
        const historicalMeals = await MealData.aggregate([
            { $match: { date: { $gte: since60 } } },
            { $group: { _id: "$dish", avgWaste: { $avg: "$wastePct" }, count: { $sum: 1 } } },
            { $match: { avgWaste: { $lt: 15 } } },
            { $sort: { avgWaste: 1 } },
            { $limit: 10 },
        ]);

        for (const m of historicalMeals) {
            if (!recentDishes.has(m._id.toLowerCase())) {
                suggestions.push({
                    dish: m._id,
                    avgWastePct: parseFloat(m.avgWaste.toFixed(1)),
                    timesServed: m.count,
                    reason: "Not served recently, low historical waste",
                });
            }
        }
    }

    return suggestions.slice(0, 8);
}
