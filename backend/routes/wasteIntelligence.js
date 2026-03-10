import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import WasteClassification from "../models/WasteClassification.js";
import { getWasteInsights, getWasteTrend } from "../services/wasteIntelligenceService.js";

const router = express.Router();

/**
 * POST /api/waste-intel/classify
 * Admin logs a classified waste entry.
 */
router.post("/classify", protect, adminOnly, async (req, res) => {
    try {
        const { date, mealType, dish, cookedExcess, servedUntouched, partiallyEaten, spoilage, notes } = req.body;
        const totalWaste = (cookedExcess || 0) + (servedUntouched || 0) + (partiallyEaten || 0) + (spoilage || 0);

        // Determine primary cause
        const cats = { "Cooked Excess": cookedExcess || 0, "Served Untouched": servedUntouched || 0, "Partially Eaten": partiallyEaten || 0, "Spoilage": spoilage || 0 };
        const primaryCause = Object.entries(cats).reduce((a, b) => a[1] > b[1] ? a : b)[0];

        const entry = new WasteClassification({
            date, mealType, dish, cookedExcess, servedUntouched, partiallyEaten, spoilage, totalWaste, primaryCause, notes,
        });
        await entry.save();
        res.json({ success: true, entry });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/waste-intel/insights
 * Full waste intelligence dashboard data.
 */
router.get("/insights", protect, adminOnly, async (req, res) => {
    try {
        const result = await getWasteInsights();
        res.json(result);
    } catch (err) {
        console.error("WASTE INTEL ERROR →", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/waste-intel/trend
 * Daily waste trend data.
 */
router.get("/trend", protect, adminOnly, async (req, res) => {
    try {
        const trend = await getWasteTrend();
        res.json({ trend });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
