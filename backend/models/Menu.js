import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    date:      { type: String, required: true, unique: true },
    breakfast: { type: [String], default: [] },
    lunch:     { type: [String], default: [] },
    dinner:    { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Menu", menuSchema);