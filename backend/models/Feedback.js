import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: String, required: true },
        text: { type: String, required: true, trim: true, maxlength: 500 },
    },
    { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
