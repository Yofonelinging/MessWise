import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import { getPreferenceDistribution, getNutritionInsights } from "../services/nutritionService.js";

const router = express.Router();

/**
 * PUT /api/nutrition/profile
 * Student updates their dietary preferences.
 */
router.put("/profile", protect, async (req, res) => {
    try {
        const { dietaryPreference, cuisinePreference, hostel, isAthlete } = req.body;

        const update = {};
        if (dietaryPreference) update.dietaryPreference = dietaryPreference;
        if (cuisinePreference) update.cuisinePreference = cuisinePreference;
        if (hostel !== undefined) update.hostel = hostel;
        if (isAthlete !== undefined) update.isAthlete = isAthlete;

        const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select(
            "name email dietaryPreference cuisinePreference hostel isAthlete"
        );

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/nutrition/profile
 * Student gets their current preferences.
 */
router.get("/profile", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select(
            "name email dietaryPreference cuisinePreference hostel isAthlete"
        );
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/nutrition/insights
 * Admin sees aggregated dietary intelligence.
 */
router.get("/insights", protect, adminOnly, async (req, res) => {
    try {
        const result = await getNutritionInsights();
        res.json(result);
    } catch (err) {
        console.error("NUTRITION INSIGHTS ERROR →", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/nutrition/distribution
 * Admin sees preference distribution.
 */
router.get("/distribution", protect, adminOnly, async (req, res) => {
    try {
        const dist = await getPreferenceDistribution();
        res.json(dist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
