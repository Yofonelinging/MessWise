import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import { generateActions } from "../services/decisionEngine.js";

const router = express.Router();

/**
 * GET /api/decisions/actions
 * Returns all autonomous operational actions.
 */
router.get("/actions", protect, adminOnly, async (req, res) => {
    try {
        const result = await generateActions();
        res.json(result);
    } catch (err) {
        console.error("DECISION ENGINE ERROR →", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
