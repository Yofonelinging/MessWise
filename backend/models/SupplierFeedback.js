import mongoose from "mongoose";

const supplierFeedbackSchema = new mongoose.Schema(
    {
        supplierName: { type: String, required: true, trim: true },
        category: { type: String, enum: ["vegetables", "dairy", "grains", "spices", "meat", "oils", "other"], required: true },
        item: { type: String, required: true, trim: true },
        // Quality metrics
        qualityScore: { type: Number, min: 1, max: 5, required: true },
        freshnessScore: { type: Number, min: 1, max: 5, required: true },
        deliveryScore: { type: Number, min: 1, max: 5, required: true },
        // Quantity
        orderedQty: { type: Number, default: 0 },
        receivedQty: { type: Number, default: 0 },
        rejectedQty: { type: Number, default: 0 },
        rejectionReason: { type: String, default: "" },
        // Context
        date: { type: String, required: true },
        notes: { type: String, default: "" },
        overallScore: { type: Number, default: 0 },
    },
    { timestamps: true }
);

supplierFeedbackSchema.index({ supplierName: 1, date: -1 });

export default mongoose.model("SupplierFeedback", supplierFeedbackSchema);
