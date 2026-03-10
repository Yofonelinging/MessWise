import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import { awardPoints, getStudentProfile, getLeaderboard, getCampusStats } from "../services/gamificationService.js";

const router = express.Router();

/**
 * GET /api/gamification/profile
 * Student gets their gamification profile.
 */
router.get("/profile", protect, async (req, res) => {
    try {
        const profile = await getStudentProfile(req.user._id);
        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * POST /api/gamification/award
 * Award points to a student (self-report or system-triggered).
 */
router.post("/award", protect, async (req, res) => {
    try {
        const { action, points, detail } = req.body;
        if (!action || !points) return res.status(400).json({ message: "action and points are required" });

        const result = await awardPoints(req.user._id, action, parseInt(points), detail || "");
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/gamification/leaderboard
 * Public leaderboard (requires auth).
 */
router.get("/leaderboard", protect, async (req, res) => {
    try {
        const leaderboard = await getLeaderboard();
        res.json({ leaderboard });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/gamification/campus-stats
 * Admin-only campus-wide gamification stats.
 */
router.get("/campus-stats", protect, adminOnly, async (req, res) => {
    try {
        const stats = await getCampusStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
