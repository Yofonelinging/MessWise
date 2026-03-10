import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import { getFatigueScores, getReplacementSuggestions } from "../services/menuFatigueService.js";

const router = express.Router();

/**
 * GET /api/fatigue/scores
 * Returns fatigue scores for all active dishes.
 */
router.get("/scores", protect, adminOnly, async (req, res) => {
    try {
        const scores = await getFatigueScores();
        res.json({ scores });
    } catch (err) {
        console.error("FATIGUE SCORES ERROR →", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/fatigue/suggestions
 * Returns replacement dish suggestions for fatigued items.
 */
router.get("/suggestions", protect, adminOnly, async (req, res) => {
    try {
        const suggestions = await getReplacementSuggestions();
        res.json({ suggestions });
    } catch (err) {
        console.error("FATIGUE SUGGESTIONS ERROR →", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
