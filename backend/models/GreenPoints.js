import mongoose from "mongoose";

const greenPointsSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        points: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        streak: { type: Number, default: 0 },          // consecutive low-waste days
        totalCO2Saved: { type: Number, default: 0 },   // kg CO2 equivalent
        totalFoodSaved: { type: Number, default: 0 },   // kg food
        badges: [{ type: String }],
        history: [
            {
                date: { type: String },
                action: { type: String },
                points: { type: Number },
                detail: { type: String, default: "" },
            },
        ],
    },
    { timestamps: true }
);

greenPointsSchema.index({ user: 1 }, { unique: true });
greenPointsSchema.index({ points: -1 }); // for leaderboard

export default mongoose.model("GreenPoints", greenPointsSchema);
