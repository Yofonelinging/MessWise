import express from "express";
import Feedback from "../models/Feedback.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
    try {
        const { text, date } = req.body;
        if (!text || !text.trim())
            return res.status(400).json({ message: "Feedback text is required." });

        const today = date || new Date().toISOString().split("T")[0];
        const newFeedback = await Feedback.create({
            studentId: req.user._id,
            text: text.trim(),
            date: today,
        });

        res.status(201).json({ success: true, feedback: newFeedback });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/", protect, adminOnly, async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate("studentId", "name email")
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ feedbacks });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
