import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import AttendanceLog from "../models/AttendanceLog.js";
import AcademicCalendar from "../models/AcademicCalendar.js";
import { getPredictions, getWeekForecast } from "../services/predictionEngine.js";

const router = express.Router();

// ── Predictions ────────────────────────────────────────────

/**
 * GET /api/prediction/tomorrow
 * Returns predicted demand for tomorrow's dishes.
 */
router.get("/tomorrow", protect, adminOnly, async (req, res) => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0];
        const result = await getPredictions(dateStr);
        res.json(result);
    } catch (err) {
        console.error("PREDICTION ERROR →", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/prediction/week
 * Returns 7-day demand forecast.
 */
router.get("/week", protect, adminOnly, async (req, res) => {
    try {
        const forecast = await getWeekForecast();
        res.json({ forecast });
    } catch (err) {
        console.error("WEEK FORECAST ERROR →", err);
        res.status(500).json({ message: err.message });
    }
});

// ── Attendance Logging ─────────────────────────────────────

/**
 * POST /api/prediction/attendance
 * Admin logs how many students ate a particular meal.
 */
router.post("/attendance", protect, adminOnly, async (req, res) => {
    try {
        const { date, mealType, headcount } = req.body;

        if (!date || !mealType || headcount == null)
            return res.status(400).json({ message: "date, mealType, and headcount are required." });

        const entry = await AttendanceLog.findOneAndUpdate(
            { date, mealType },
            { headcount, source: "manual" },
            { new: true, upsert: true }
        );

        res.status(201).json({ success: true, entry });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/prediction/attendance
 * Returns recent attendance logs for charting.
 */
router.get("/attendance", protect, adminOnly, async (req, res) => {
    try {
        const logs = await AttendanceLog.find().sort({ date: -1 }).limit(90);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── Academic Calendar ──────────────────────────────────────

/**
 * POST /api/prediction/calendar
 * Admin adds / updates a calendar event for a specific date.
 */
router.post("/calendar", protect, adminOnly, async (req, res) => {
    try {
        const { date, eventType, description } = req.body;

        if (!date || !eventType)
            return res.status(400).json({ message: "date and eventType are required." });

        const entry = await AcademicCalendar.findOneAndUpdate(
            { date },
            { eventType, description: description || "" },
            { new: true, upsert: true }
        );

        res.status(201).json({ success: true, entry });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/prediction/calendar
 * Returns upcoming calendar events (next 30 days + past 7 days).
 */
router.get("/calendar", protect, adminOnly, async (req, res) => {
    try {
        const past7 = new Date(); past7.setDate(past7.getDate() - 7);
        const ahead30 = new Date(); ahead30.setDate(ahead30.getDate() + 30);

        const events = await AcademicCalendar.find({
            date: {
                $gte: past7.toISOString().split("T")[0],
                $lte: ahead30.toISOString().split("T")[0],
            },
        }).sort({ date: 1 });

        res.json({ events });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
