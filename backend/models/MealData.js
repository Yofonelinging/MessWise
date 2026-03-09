import mongoose from "mongoose";

const mealDataSchema = new mongoose.Schema(
  {
    date:     { type: String, required: true },
    mealType: { type: String, enum: ["Breakfast", "Lunch", "Dinner"], required: true },
    dish:     { type: String, required: true, trim: true },
    prepared: { type: Number, required: true, min: 0 },
    leftover: { type: Number, required: true, min: 0 },
    wastePct: { type: Number },
  },
  { timestamps: true }
);

mealDataSchema.pre("save", function (next) {
  this.wastePct = this.prepared > 0
    ? parseFloat(((this.leftover / this.prepared) * 100).toFixed(1))
    : 0;
  next();
});

export default mongoose.model("MealData", mealDataSchema);