import mongoose from "mongoose";

const wasteClassificationSchema = new mongoose.Schema(
    {
        date: { type: String, required: true },
        mealType: { type: String, enum: ["Breakfast", "Lunch", "Dinner"], required: true },
        dish: { type: String, required: true },
        // Waste category breakdown (in kg)
        cookedExcess: { type: Number, default: 0 },   // Kitchen over-production
        servedUntouched: { type: Number, default: 0 },  // Served but not eaten
        partiallyEaten: { type: Number, default: 0 },   // Left on plate
        spoilage: { type: Number, default: 0 },   // Quality/freshness issue
        // Derived
        totalWaste: { type: Number, default: 0 },
        primaryCause: { type: String, default: "" },
        notes: { type: String, default: "" },
    },
    { timestamps: true }
);

wasteClassificationSchema.index({ date: 1, mealType: 1 });

export default mongoose.model("WasteClassification", wasteClassificationSchema);
