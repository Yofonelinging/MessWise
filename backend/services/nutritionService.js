/**
 * Nutrition & Equity Service
 *
 * Clusters student dietary preferences and generates
 * actionable insights for menu planning.
 */

import User from "../models/User.js";
import AcademicCalendar from "../models/AcademicCalendar.js";

/**
 * Get anonymized distribution of dietary & cuisine preferences.
 */
export async function getPreferenceDistribution() {
    const students = await User.find({ role: "student" }).select(
        "dietaryPreference cuisinePreference isAthlete hostel -_id"
    );

    const total = students.length || 1;

    // Dietary breakdown
    const dietaryCounts = {};
    for (const s of students) {
        const pref = s.dietaryPreference || "veg";
        dietaryCounts[pref] = (dietaryCounts[pref] || 0) + 1;
    }
    const dietaryBreakdown = Object.entries(dietaryCounts).map(([name, count]) => ({
        name,
        count,
        pct: parseFloat(((count / total) * 100).toFixed(1)),
    })).sort((a, b) => b.count - a.count);

    // Cuisine breakdown
    const cuisineCounts = {};
    for (const s of students) {
        for (const c of s.cuisinePreference || ["no-preference"]) {
            cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
        }
    }
    const cuisineBreakdown = Object.entries(cuisineCounts).map(([name, count]) => ({
        name,
        count,
        pct: parseFloat(((count / total) * 100).toFixed(1)),
    })).sort((a, b) => b.count - a.count);

    // Athletes
    const athleteCount = students.filter(s => s.isAthlete).length;

    // Hostel distribution
    const hostelCounts = {};
    for (const s of students) {
        if (s.hostel) {
            hostelCounts[s.hostel] = (hostelCounts[s.hostel] || 0) + 1;
        }
    }
    const hostelBreakdown = Object.entries(hostelCounts).map(([name, count]) => ({
        name,
        count,
    })).sort((a, b) => b.count - a.count);

    return {
        totalStudents: students.length,
        dietaryBreakdown,
        cuisineBreakdown,
        athleteCount,
        athletePct: parseFloat(((athleteCount / total) * 100).toFixed(1)),
        hostelBreakdown,
    };
}

/**
 * Generate actionable nutrition insights based on preferences + context.
 */
export async function getNutritionInsights() {
    const dist = await getPreferenceDistribution();
    const insights = [];

    // Dietary insights
    const vegPct = dist.dietaryBreakdown.find(d => d.name === "veg")?.pct || 0;
    const nonVegPct = dist.dietaryBreakdown.find(d => d.name === "non-veg")?.pct || 0;

    if (vegPct > 60) {
        insights.push({
            type: "dietary",
            severity: "info",
            icon: "🥬",
            message: `${vegPct}% of students are vegetarian — ensure sufficient veg variety at all meals.`,
        });
    }

    if (nonVegPct > 30) {
        insights.push({
            type: "dietary",
            severity: "info",
            icon: "🍗",
            message: `${nonVegPct}% prefer non-veg — consider adding non-veg options at lunch and dinner.`,
        });
    }

    // Cuisine insights
    const southPct = dist.cuisineBreakdown.find(d => d.name === "south")?.pct || 0;
    const northPct = dist.cuisineBreakdown.find(d => d.name === "north")?.pct || 0;

    if (southPct > 30) {
        insights.push({
            type: "cuisine",
            severity: "suggestion",
            icon: "🍚",
            message: `${southPct}% prefer South Indian — add more dosa/idli/sambar options at breakfast.`,
        });
    }

    if (northPct > 30) {
        insights.push({
            type: "cuisine",
            severity: "suggestion",
            icon: "🫓",
            message: `${northPct}% prefer North Indian — ensure roti/paratha options are always available.`,
        });
    }

    // Athlete insights
    if (dist.athletePct > 10) {
        insights.push({
            type: "nutrition",
            severity: "important",
            icon: "💪",
            message: `${dist.athleteCount} athletes (${dist.athletePct}%) need high-protein meals — increase paneer, eggs, and dal portions on sports training days.`,
        });
    }

    // Calendar-aware insights
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingEvents = await AcademicCalendar.find({
        date: { $gte: today, $lte: nextWeek.toISOString().split("T")[0] },
        eventType: { $ne: "normal" },
    });

    for (const event of upcomingEvents) {
        if (event.eventType === "exam_week") {
            insights.push({
                type: "context",
                severity: "warning",
                icon: "📝",
                message: `Exam week on ${event.date} — reduce spicy/heavy dishes, increase light comfort food.`,
            });
        }
        if (event.eventType === "festival") {
            insights.push({
                type: "context",
                severity: "info",
                icon: "🎉",
                message: `Festival on ${event.date} — expect lower turnout, consider special menu items.`,
            });
        }
        if (event.eventType === "sports_day") {
            insights.push({
                type: "context",
                severity: "suggestion",
                icon: "🏅",
                message: `Sports day on ${event.date} — increase protein options and hydration drinks.`,
            });
        }
    }

    // Default insight if no data
    if (insights.length === 0 && dist.totalStudents === 0) {
        insights.push({
            type: "info",
            severity: "info",
            icon: "📊",
            message: "No student preference data yet. Students can set their dietary preferences on their dashboard.",
        });
    }

    return { distribution: dist, insights };
}
