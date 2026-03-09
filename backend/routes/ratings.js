import express from "express";
import Rating from "../models/Rating.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { dish, rating, date } = req.body;
    if (!dish || !rating)
      return res.status(400).json({ message: "Dish and rating are required." });

    const today    = date || new Date().toISOString().split("T")[0];
    const existing = await Rating.findOne({ studentId: req.user._id, dish, date: today });

    if (existing) {
      existing.rating = rating;
      await existing.save();
      return res.json({ success: true, rating: existing });
    }

    const newRating = await Rating.create({ studentId: req.user._id, dish, rating, date: today });
    res.status(201).json({ success: true, rating: newRating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const aggregated = await Rating.aggregate([
      { $group: { _id: "$dish", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      { $sort: { avg: -1 } },
    ]);
    const ratings = aggregated.map(r => ({ dish: r._id, avg: parseFloat(r.avg.toFixed(1)), count: r.count }));
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;