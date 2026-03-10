import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import SupplierFeedback from "../models/SupplierFeedback.js";
import { getSupplyChainInsights } from "../services/supplyChainService.js";

const router = express.Router();

/**
 * POST /api/supply-chain/feedback
 * Admin logs a supplier delivery record.
 */
router.post("/feedback", protect, adminOnly, async (req, res) => {
    try {
        const { supplierName, category, item, qualityScore, freshnessScore, deliveryScore, orderedQty, receivedQty, rejectedQty, rejectionReason, date, notes } = req.body;
        const overallScore = parseFloat(((qualityScore + freshnessScore + deliveryScore) / 3).toFixed(1));

        const entry = new SupplierFeedback({
            supplierName, category, item, qualityScore, freshnessScore, deliveryScore,
            orderedQty, receivedQty, rejectedQty, rejectionReason, date, notes, overallScore,
        });
        await entry.save();
        res.json({ success: true, entry });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * GET /api/supply-chain/insights
 * Full supply chain dashboard data.
 */
router.get("/insights", protect, adminOnly, async (req, res) => {
    try {
        const result = await getSupplyChainInsights();
        res.json(result);
    } catch (err) {
        console.error("SUPPLY CHAIN ERROR →", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
