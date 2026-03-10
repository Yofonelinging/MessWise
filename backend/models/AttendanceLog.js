import mongoose from "mongoose";

const attendanceLogSchema = new mongoose.Schema(
    {
        date: { type: String, required: true },
        mealType: {
            type: String,
            enum: ["Breakfast", "Lunch", "Dinner"],
            required: true,
        },
        headcount: { type: Number, required: true, min: 0 },
        source: {
            type: String,
            enum: ["manual", "swipe"],
            default: "manual",
        },
    },
    { timestamps: true }
);

// Compound index: one entry per date + mealType
attendanceLogSchema.index({ date: 1, mealType: 1 }, { unique: true });

export default mongoose.model("AttendanceLog", attendanceLogSchema);
