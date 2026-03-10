import express from "express";
import Menu from "../models/Menu.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// GET /api/menu/today  →  used by Student Dashboard
router.get("/today", async (req, res) => {
  try {
    // Use local server date (not UTC) to match admin-posted dates
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const menu = await Menu.findOne({ date: today });

    if (!menu)
      return res.status(404).json({ message: "No menu posted for today yet." });

    const meals = [
      ...menu.breakfast.map(name => ({ type: "Breakfast", items: [name], date: new Date().toISOString() })),
      ...menu.lunch.map(name => ({ type: "Lunch", items: [name], date: new Date().toISOString() })),
      ...menu.dinner.map(name => ({ type: "Dinner", items: [name], date: new Date().toISOString() })),
    ];

    res.json({ meals, raw: menu });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/menu  →  admin posts today's menu
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner } = req.body;

    if (!date)
      return res.status(400).json({ message: "Date is required." });

    const menu = await Menu.findOneAndUpdate(
      { date },
      { breakfast: breakfast || [], lunch: lunch || [], dinner: dinner || [] },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, menu });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/menu  →  get all menus (admin)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const menus = await Menu.find().sort({ date: -1 }).limit(30);
    res.json({ menus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;