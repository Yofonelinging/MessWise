import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dish:      { type: String, required: true, trim: true },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    date:      { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Rating", ratingSchema);