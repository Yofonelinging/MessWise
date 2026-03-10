/**
 * Gamification Service
 *
 * Manages the GreenPoints economy:
 *   - Award points for low-waste behaviour
 *   - Track streaks & levels
 *   - CO2 & food savings calculations
 *   - Leaderboard
 *   - Badge system
 */

import GreenPoints from "../models/GreenPoints.js";
import User from "../models/User.js";

// ── Constants ──────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, 5000];
const LEVEL_NAMES = [
    "Seedling", "Sprout", "Sapling", "Tree", "Forest",
    "Grove", "Ecosystem", "Biome", "Planet Saver", "Legend", "Infinity",
];
const CO2_PER_KG_FOOD = 2.5; // kg CO2 per kg food saved (avg)

const BADGE_DEFINITIONS = [
    { id: "first_rating", name: "First Rating", icon: "⭐", condition: (gp) => gp.history.length >= 1 },
    { id: "streak_3", name: "3-Day Streak", icon: "🔥", condition: (gp) => gp.streak >= 3 },
    { id: "streak_7", name: "Weekly Warrior", icon: "💎", condition: (gp) => gp.streak >= 7 },
    { id: "points_100", name: "Century Club", icon: "💯", condition: (gp) => gp.points >= 100 },
    { id: "points_500", name: "Green Champion", icon: "🏆", condition: (gp) => gp.points >= 500 },
    { id: "co2_10", name: "Carbon Cutter", icon: "🌍", condition: (gp) => gp.totalCO2Saved >= 10 },
    { id: "food_5", name: "Food Hero", icon: "🍽️", condition: (gp) => gp.totalFoodSaved >= 5 },
    { id: "level_5", name: "Eco Elite", icon: "🌿", condition: (gp) => gp.level >= 5 },
];

// ── Helpers ────────────────────────────────────────────────

function calculateLevel(points) {
    let level = 1;
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        if (points >= LEVEL_THRESHOLDS[i]) level = i + 1;
        else break;
    }
    return level;
}

function nextLevelThreshold(level) {
    return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 1000;
}

function checkBadges(gp) {
    const newBadges = [];
    for (const badge of BADGE_DEFINITIONS) {
        if (!gp.badges.includes(badge.id) && badge.condition(gp)) {
            gp.badges.push(badge.id);
            newBadges.push(badge);
        }
    }
    return newBadges;
}

// ── Public API ─────────────────────────────────────────────

/**
 * Award points to a student for a specific action.
 */
export async function awardPoints(userId, action, pointsAwarded, detail = "") {
    let gp = await GreenPoints.findOne({ user: userId });
    if (!gp) {
        gp = new GreenPoints({ user: userId });
    }

    const today = new Date().toISOString().split("T")[0];

    gp.points += pointsAwarded;
    gp.level = calculateLevel(gp.points);

    // Streak logic: if last action was yesterday, increment; else reset
    const lastEntry = gp.history[gp.history.length - 1];
    if (lastEntry) {
        const lastDate = new Date(lastEntry.date);
        const diff = (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);
        if (diff === 1) gp.streak += 1;
        else if (diff > 1) gp.streak = 1;
    } else {
        gp.streak = 1;
    }

    // Track environmental impact
    if (action === "low_waste" || action === "clean_plate") {
        const foodSaved = pointsAwarded * 0.05; // rough estimate
        gp.totalFoodSaved += foodSaved;
        gp.totalCO2Saved += foodSaved * CO2_PER_KG_FOOD;
    }

    // Add to history (keep last 50 entries)
    gp.history.push({ date: today, action, points: pointsAwarded, detail });
    if (gp.history.length > 50) gp.history = gp.history.slice(-50);

    // Check for new badges
    const newBadges = checkBadges(gp);

    await gp.save();

    return {
        points: gp.points,
        level: gp.level,
        levelName: LEVEL_NAMES[gp.level - 1] || "Legend",
        streak: gp.streak,
        newBadges,
    };
}

/**
 * Get a student's gamification profile.
 */
export async function getStudentProfile(userId) {
    let gp = await GreenPoints.findOne({ user: userId });
    if (!gp) {
        gp = new GreenPoints({ user: userId });
        await gp.save();
    }

    const level = gp.level;
    const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextThreshold = nextLevelThreshold(level);
    const progressPct = nextThreshold > currentThreshold
        ? Math.round(((gp.points - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
        : 100;

    const earnedBadges = BADGE_DEFINITIONS.filter(b => gp.badges.includes(b.id));

    return {
        points: gp.points,
        level,
        levelName: LEVEL_NAMES[level - 1] || "Legend",
        nextLevelAt: nextThreshold,
        progressPct,
        streak: gp.streak,
        totalCO2Saved: parseFloat(gp.totalCO2Saved.toFixed(1)),
        totalFoodSaved: parseFloat(gp.totalFoodSaved.toFixed(1)),
        earnedBadges,
        recentHistory: gp.history.slice(-10).reverse(),
    };
}

/**
 * Get the campus-wide leaderboard.
 */
export async function getLeaderboard(limit = 20) {
    const entries = await GreenPoints.find()
        .sort({ points: -1 })
        .limit(limit)
        .populate("user", "name email hostel")
        .lean();

    return entries.map((e, i) => ({
        rank: i + 1,
        name: e.user?.name || "Anonymous",
        hostel: e.user?.hostel || "",
        points: e.points,
        level: e.level,
        levelName: LEVEL_NAMES[e.level - 1] || "Legend",
        streak: e.streak,
        co2Saved: parseFloat((e.totalCO2Saved || 0).toFixed(1)),
    }));
}

/**
 * Get campus-wide gamification stats for admin.
 */
export async function getCampusStats() {
    const agg = await GreenPoints.aggregate([
        {
            $group: {
                _id: null,
                totalPlayers: { $sum: 1 },
                totalPoints: { $sum: "$points" },
                totalCO2Saved: { $sum: "$totalCO2Saved" },
                totalFoodSaved: { $sum: "$totalFoodSaved" },
                avgPoints: { $avg: "$points" },
                avgStreak: { $avg: "$streak" },
            },
        },
    ]);

    const stats = agg[0] || { totalPlayers: 0, totalPoints: 0, totalCO2Saved: 0, totalFoodSaved: 0, avgPoints: 0, avgStreak: 0 };

    return {
        totalPlayers: stats.totalPlayers,
        totalPoints: stats.totalPoints,
        totalCO2Saved: parseFloat((stats.totalCO2Saved || 0).toFixed(1)),
        totalFoodSaved: parseFloat((stats.totalFoodSaved || 0).toFixed(1)),
        avgPoints: Math.round(stats.avgPoints || 0),
        avgStreak: parseFloat((stats.avgStreak || 0).toFixed(1)),
    };
}
