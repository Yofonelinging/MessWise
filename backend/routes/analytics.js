import express from "express";
import MealData from "../models/MealData.js";
import Rating from "../models/Rating.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", protect, async (req, res) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const todayRecords = await MealData.find({ date: today });
    const totalWasteKg = todayRecords.reduce((sum, r) => sum + r.leftover, 0);
    const totalPrepared = todayRecords.reduce((sum, r) => sum + r.prepared, 0);
    const wastePct = totalPrepared > 0
      ? parseFloat(((totalWasteKg / totalPrepared) * 100).toFixed(1)) : 0;

    const stats = {
      wasteKg: parseFloat(totalWasteKg.toFixed(1)),
      wastePct,
    };

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const todayRecords = await MealData.find({ date: today });
    const totalWasteKg = todayRecords.reduce((sum, r) => sum + r.leftover, 0);
    const totalPrepared = todayRecords.reduce((sum, r) => sum + r.prepared, 0);
    const wastePct = totalPrepared > 0
      ? parseFloat(((totalWasteKg / totalPrepared) * 100).toFixed(1)) : 0;

    const todayRatings = await Rating.find({ date: today });
    const avgRating = todayRatings.length > 0
      ? parseFloat((todayRatings.reduce((s, r) => s + r.rating, 0) / todayRatings.length).toFixed(1)) : 0;

    const stats = {
      mealsServed: totalPrepared > 0 ? Math.round(totalPrepared * 2) : 0,
      wasteKg: parseFloat(totalWasteKg.toFixed(1)),
      wastePct,
      avgRating,
    };

    const dishAgg = await MealData.aggregate([{ $group: { _id: "$dish", waste: { $sum: "$leftover" } } }, { $sort: { waste: -1 } }, { $limit: 8 }]);
    const wasteByDish = dishAgg.map(d => ({ dish: d._id, waste: parseFloat(d.waste.toFixed(1)) }));

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trendAgg = await MealData.aggregate([{ $group: { _id: "$date", waste: { $sum: "$leftover" } } }, { $sort: { _id: -1 } }, { $limit: 7 }]);
    const wasteTrend = trendAgg.reverse().map(d => ({ date: days[new Date(d._id).getDay()], waste: parseFloat(d.waste.toFixed(1)) }));

    const mealTypeAgg = await MealData.aggregate([{ $group: { _id: "$mealType", value: { $sum: "$leftover" } } }]);
    const wasteByMeal = mealTypeAgg.map(m => ({ name: m._id, value: parseFloat(m.value.toFixed(1)) }));

    const ratingAgg = await Rating.aggregate([{ $group: { _id: "$dish", avg: { $avg: "$rating" }, count: { $sum: 1 } } }, { $sort: { avg: -1 } }]);
    const ratings = ratingAgg.map(r => ({ dish: r._id, avg: parseFloat(r.avg.toFixed(1)), count: r.count }));

    const historyRaw = await MealData.find().sort({ createdAt: -1 }).limit(20);
    const history = historyRaw.map(r => ({ date: r.date, mealType: r.mealType, dish: r.dish, prepared: r.prepared, waste: r.leftover, rating: 0 }));

    const predAgg = await MealData.aggregate([{ $group: { _id: "$dish", avgPrepared: { $avg: "$prepared" } } }, { $sort: { avgPrepared: -1 } }, { $limit: 5 }]);
    const prediction = predAgg.map(p => ({ dish: p._id, qty: Math.round(p.avgPrepared * 1.05) }));

    res.json({ stats, wasteByDish, wasteTrend, wasteByMeal, ratings, history, prediction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;