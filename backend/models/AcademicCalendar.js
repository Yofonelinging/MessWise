import mongoose from "mongoose";

const academicCalendarSchema = new mongoose.Schema(
    {
        date: { type: String, required: true, unique: true },
        eventType: {
            type: String,
            enum: ["exam_week", "festival", "holiday", "sports_day", "normal"],
            default: "normal",
        },
        description: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model("AcademicCalendar", academicCalendarSchema);
