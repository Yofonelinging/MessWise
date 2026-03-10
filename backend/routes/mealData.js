import express from "express";
import MealData from "../models/MealData.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { date, mealType, dish, prepared, leftover } = req.body;

    if (!date || !mealType || !dish || prepared == null || leftover == null)
      return res.status(400).json({ message: "All fields are required." });

    if (leftover > prepared)
      return res.status(400).json({ message: "Leftover cannot exceed prepared quantity." });

    const wastePct = prepared > 0
      ? parseFloat(((leftover / prepared) * 100).toFixed(1))
      : 0;

    const entry = new MealData({ date, mealType, dish, prepared, leftover, wastePct });
    await entry.save();
    res.status(201).json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const records = await MealData.find().sort({ date: -1 }).limit(100);
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;