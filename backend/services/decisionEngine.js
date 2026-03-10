/**
 * Autonomous Decision Engine
 *
 * Converts analytics data into concrete operational actions:
 *   - Cooking quantity adjustments based on predictions
 *   - Portion size recommendations based on waste
 *   - Menu swap suggestions from fatigue analysis
 *   - Staffing / timing suggestions from attendance patterns
 *   - Procurement adjustments from trend data
 *
 * Each action has a priority (critical/high/medium/low),
 * a category, and a concrete actionable instruction.
 */

import MealData from "../models/MealData.js";
import AttendanceLog from "../models/AttendanceLog.js";
import AcademicCalendar from "../models/AcademicCalendar.js";
import { getPredictions } from "./predictionEngine.js";
import { getFatigueScores } from "./menuFatigueService.js";
import { getPreferenceDistribution } from "./nutritionService.js";

function dateDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
}

function tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
}

// ── Action builders ────────────────────────────────────────

async function cookingActions() {
    const actions = [];
    try {
        const pred = await getPredictions(tomorrow());
        for (const p of pred.predictions || []) {
            if (p.modifiers?.combined < 0.8) {
                actions.push({
                    category: "cooking",
                    priority: "high",
                    icon: "🍳",
                    title: `Reduce ${p.dish} prep by ${Math.round((1 - p.modifiers.combined) * 100)}%`,
                    detail: `Predicted demand is ${p.predictedQty} kg (base ${p.baseAvg} kg). Key factor: ${p.modifiers.weather < 0.95 ? "weather" :
                            p.modifiers.calendar < 0.9 ? "calendar event" :
                                p.modifiers.attendance < 0.9 ? "low attendance trend" : "combined factors"
                        }.`,
                    metric: `${p.predictedQty} kg recommended`,
                });
            } else if (p.modifiers?.combined > 1.1) {
                actions.push({
                    category: "cooking",
                    priority: "medium",
                    icon: "📈",
                    title: `Increase ${p.dish} prep by ${Math.round((p.modifiers.combined - 1) * 100)}%`,
                    detail: `Demand trend is up. Predicted: ${p.predictedQty} kg vs base ${p.baseAvg} kg.`,
                    metric: `${p.predictedQty} kg recommended`,
                });
            }
        }
    } catch { /* prediction data not available, skip */ }
    return actions;
}

async function wasteActions() {
    const actions = [];
    const since7 = dateDaysAgo(7);

    const highWaste = await MealData.aggregate([
        { $match: { date: { $gte: since7 } } },
        { $addFields: { wastePct: { $multiply: [{ $divide: ["$leftover", { $max: ["$prepared", 1] }] }, 100] } } },
        { $match: { wastePct: { $gt: 20 } } },
        { $sort: { wastePct: -1 } },
        { $limit: 5 },
    ]);

    for (const item of highWaste) {
        const pct = Math.round((item.leftover / Math.max(item.prepared, 1)) * 100);
        actions.push({
            category: "portions",
            priority: pct > 30 ? "critical" : "high",
            icon: "⚖️",
            title: `${item.dish}: ${pct}% waste — reduce portion sizes`,
            detail: `${item.leftover} kg wasted out of ${item.prepared} kg prepared on ${item.date} (${item.mealType}). Consider reducing by ${Math.round(item.leftover * 0.7)} kg.`,
            metric: `${item.leftover} kg wasted`,
        });
    }

    return actions;
}

async function fatigueActions() {
    const actions = [];
    try {
        const scores = await getFatigueScores();
        const critical = scores.filter(s => s.status === "critical");
        const warning = scores.filter(s => s.status === "warning");

        for (const s of critical.slice(0, 3)) {
            actions.push({
                category: "menu",
                priority: "critical",
                icon: "🔄",
                title: `Replace ${s.dish} — fatigue score ${s.fatigueScore}/100`,
                detail: `Repeated ${s.repeatsIn14Days}× in 14 days. ${s.avgWastePct !== null ? `Avg waste: ${s.avgWastePct}%` : ""}. ${s.avgRating !== null ? `Rating: ${s.avgRating}★` : ""}.`,
                metric: `Score: ${s.fatigueScore}/100`,
            });
        }

        for (const s of warning.slice(0, 2)) {
            actions.push({
                category: "menu",
                priority: "medium",
                icon: "⚠️",
                title: `Monitor ${s.dish} — showing fatigue signs (${s.fatigueScore}/100)`,
                detail: `Consider rotating this dish out if fatigue increases. Repeated ${s.repeatsIn14Days}× recently.`,
                metric: `Score: ${s.fatigueScore}/100`,
            });
        }
    } catch { /* skip */ }
    return actions;
}

async function calendarActions() {
    const actions = [];
    const today = new Date().toISOString().split("T")[0];
    const next3 = new Date();
    next3.setDate(next3.getDate() + 3);

    const events = await AcademicCalendar.find({
        date: { $gte: today, $lte: next3.toISOString().split("T")[0] },
        eventType: { $ne: "normal" },
    });

    for (const ev of events) {
        const map = {
            exam_week: { pri: "high", msg: "Reduce cooking quantities by ~25%. Serve light comfort food (khichdi, soup, curd rice)." },
            festival: { pri: "high", msg: "Expect ~40% lower turnout. Consider special festive menu items." },
            holiday: { pri: "medium", msg: "Very low turnout expected (~50%). Scale down all batches significantly." },
            sports_day: { pri: "medium", msg: "Increase protein portions. Add energy drinks and fruit options." },
        };
        const cfg = map[ev.eventType];
        if (cfg) {
            actions.push({
                category: "operations",
                priority: cfg.pri,
                icon: ev.eventType === "exam_week" ? "📝" : ev.eventType === "festival" ? "🎉" : ev.eventType === "holiday" ? "🏖️" : "🏅",
                title: `${ev.eventType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} on ${ev.date}`,
                detail: cfg.msg + (ev.description ? ` (${ev.description})` : ""),
                metric: ev.eventType,
            });
        }
    }

    return actions;
}

async function nutritionActions() {
    const actions = [];
    try {
        const dist = await getPreferenceDistribution();
        if (dist.athletePct > 15) {
            actions.push({
                category: "nutrition",
                priority: "medium",
                icon: "💪",
                title: `${dist.athleteCount} athletes (${dist.athletePct}%) — add protein-rich options`,
                detail: "Increase paneer, eggs, sprouts, and dal portions. Consider a dedicated high-protein counter.",
                metric: `${dist.athleteCount} athletes`,
            });
        }
    } catch { /* skip */ }
    return actions;
}

// ── Main API ───────────────────────────────────────────────

/**
 * Generate all autonomous actions from all data sources.
 */
export async function generateActions() {
    const [cooking, waste, fatigue, calendar, nutrition] = await Promise.all([
        cookingActions(),
        wasteActions(),
        fatigueActions(),
        calendarActions(),
        nutritionActions(),
    ]);

    const all = [...cooking, ...waste, ...fatigue, ...calendar, ...nutrition];

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    all.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));

    const summary = {
        total: all.length,
        critical: all.filter(a => a.priority === "critical").length,
        high: all.filter(a => a.priority === "high").length,
        medium: all.filter(a => a.priority === "medium").length,
        low: all.filter(a => a.priority === "low").length,
    };

    return { actions: all, summary, generatedAt: new Date().toISOString() };
}
