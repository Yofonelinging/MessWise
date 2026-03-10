/**
 * Consumption Prediction Engine
 *
 * Predicts meal demand for upcoming days using:
 *   1. Historical MealData (prepared, leftover, waste%)
 *   2. AttendanceLog headcounts
 *   3. Weather forecast (rainy → lower turnout)
 *   4. Academic calendar events (exams, festivals, holidays)
 *   5. Menu repetition decay (fatigue factor)
 *
 * All factors produce a modifier around 1.0.
 * Final prediction = baseAvg × Π(modifiers) , clamped ≥ 0.
 */

import MealData from "../models/MealData.js";
import AttendanceLog from "../models/AttendanceLog.js";
import AcademicCalendar from "../models/AcademicCalendar.js";
import Menu from "../models/Menu.js";
import { getWeatherCached } from "./WeatherService.js";

// ── Helpers ────────────────────────────────────────────────
function dateDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
}

function dateDaysAhead(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
}

function dayOfWeek(dateStr) {
    return new Date(dateStr).getDay(); // 0=Sun … 6=Sat
}

// ── Modifier functions ─────────────────────────────────────

/** Weekend factor: Sat/Sun typically see ~20 % lower turnout */
function weekendModifier(targetDate) {
    const dow = dayOfWeek(targetDate);
    if (dow === 0 || dow === 6) return 0.80;
    return 1.0;
}

/** Weather modifier: rainy days reduce turnout a bit */
function weatherModifier(weather) {
    if (weather.isRainy) return 0.88;
    if (weather.temperature > 40) return 0.92; // extreme heat
    return 1.0;
}

/** Academic calendar modifier */
function calendarModifier(event) {
    if (!event) return 1.0;
    const map = {
        exam_week: 0.75,  // students skip meals during exams
        festival: 0.60,  // many students fast or leave campus
        holiday: 0.50,  // very low attendance
        sports_day: 1.10,  // slightly higher demand
        normal: 1.0,
    };
    return map[event.eventType] ?? 1.0;
}

/**
 * Menu repetition (fatigue) decay.
 * If a dish has appeared N times in the last 14 days,
 * apply an exponential decay to expected consumption.
 */
function fatigueModifier(dish, recentMenus) {
    let repeatCount = 0;
    for (const m of recentMenus) {
        const allItems = [...(m.breakfast || []), ...(m.lunch || []), ...(m.dinner || [])];
        if (allItems.some(i => i.toLowerCase() === dish.toLowerCase())) repeatCount++;
    }
    if (repeatCount <= 1) return 1.0;
    // Each repeat beyond the first reduces by 5 %, capped at 0.70
    return Math.max(0.70, 1 - (repeatCount - 1) * 0.05);
}

/**
 * Attendance trend modifier: compare last-7-day avg headcount
 * to last-30-day avg headcount for the same mealType.
 */
async function attendanceTrendModifier(mealType) {
    const last30 = dateDaysAgo(30);
    const last7 = dateDaysAgo(7);

    const [agg30, agg7] = await Promise.all([
        AttendanceLog.aggregate([
            { $match: { mealType, date: { $gte: last30 } } },
            { $group: { _id: null, avg: { $avg: "$headcount" } } },
        ]),
        AttendanceLog.aggregate([
            { $match: { mealType, date: { $gte: last7 } } },
            { $group: { _id: null, avg: { $avg: "$headcount" } } },
        ]),
    ]);

    const avg30 = agg30[0]?.avg || 0;
    const avg7 = agg7[0]?.avg || 0;

    if (avg30 === 0) return 1.0;
    const ratio = avg7 / avg30;
    // Clamp between 0.7 and 1.3 to avoid wild swings
    return Math.max(0.7, Math.min(1.3, ratio));
}

// ── Core prediction ────────────────────────────────────────

/**
 * Predict demand for a single dish on a given date & mealType.
 */
async function predictDish(dish, mealType, targetDate, weather, calendarEvent, recentMenus) {
    const since = dateDaysAgo(30);

    // Historical average prepared & consumed (prepared − leftover)
    const history = await MealData.aggregate([
        { $match: { dish: { $regex: new RegExp(`^${dish}$`, "i") }, date: { $gte: since } } },
        {
            $group: {
                _id: null,
                avgPrepared: { $avg: "$prepared" },
                avgConsumed: { $avg: { $subtract: ["$prepared", "$leftover"] } },
                count: { $sum: 1 },
            },
        },
    ]);

    // If no history, fall back to a generic reasonable default
    const base = history[0]?.avgConsumed ?? history[0]?.avgPrepared ?? 50;

    // Collect modifiers
    const mods = [
        weekendModifier(targetDate),
        weatherModifier(weather),
        calendarModifier(calendarEvent),
        fatigueModifier(dish, recentMenus),
        await attendanceTrendModifier(mealType),
    ];

    const combined = mods.reduce((a, b) => a * b, 1);
    const predicted = Math.max(0, Math.round(base * combined));

    return {
        dish,
        mealType,
        predictedQty: predicted,
        baseAvg: Math.round(base),
        modifiers: {
            weekend: mods[0],
            weather: mods[1],
            calendar: mods[2],
            fatigue: mods[3],
            attendance: mods[4],
            combined: parseFloat(combined.toFixed(3)),
        },
    };
}

// ── Public API ──────────────────────────────────────────────

/**
 * Get predictions for all dishes on a particular date.
 * If a menu is set for that date, use its dishes; otherwise use top historical dishes.
 */
export async function getPredictions(targetDate) {
    // 1. Gather context
    const [weather, calendarEvent, recentMenus] = await Promise.all([
        getWeatherCached(),
        AcademicCalendar.findOne({ date: targetDate }),
        Menu.find({ date: { $gte: dateDaysAgo(14) } }),
    ]);

    // 2. Determine dishes to predict
    const menu = await Menu.findOne({ date: targetDate });
    let dishSets = [];

    if (menu) {
        for (const item of menu.breakfast || []) dishSets.push({ dish: item, mealType: "Breakfast" });
        for (const item of menu.lunch || []) dishSets.push({ dish: item, mealType: "Lunch" });
        for (const item of menu.dinner || []) dishSets.push({ dish: item, mealType: "Dinner" });
    } else {
        // No menu set yet — predict for the top 10 historically served dishes
        const topDishes = await MealData.aggregate([
            { $group: { _id: "$dish", count: { $sum: 1 }, lastMealType: { $last: "$mealType" } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        dishSets = topDishes.map(d => ({ dish: d._id, mealType: d.lastMealType }));
    }

    // 3. Build predictions
    const predictions = await Promise.all(
        dishSets.map(({ dish, mealType }) =>
            predictDish(dish, mealType, targetDate, weather, calendarEvent, recentMenus)
        )
    );

    return {
        date: targetDate,
        weather,
        calendarEvent: calendarEvent || { eventType: "normal", description: "" },
        predictions,
    };
}

/**
 * Get a 7-day forecast starting from tomorrow.
 */
export async function getWeekForecast() {
    const days = [];
    for (let i = 1; i <= 7; i++) {
        const date = dateDaysAhead(i);
        const result = await getPredictions(date);
        days.push(result);
    }
    return days;
}
