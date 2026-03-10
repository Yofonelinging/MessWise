import mongoose from "mongoose";

const mealDataSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    mealType: { type: String, enum: ["Breakfast", "Lunch", "Dinner"], required: true },
    dish: { type: String, required: true, trim: true },
    prepared: { type: Number, required: true, min: 0 },
    leftover: { type: Number, required: true, min: 0 },
    wastePct: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("MealData", mealDataSchema);