import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    dietaryPreference: {
      type: String,
      enum: ["veg", "non-veg", "vegan", "jain", "eggetarian"],
      default: "veg",
    },
    cuisinePreference: {
      type: [String],
      enum: ["north", "south", "continental", "chinese", "no-preference"],
      default: ["no-preference"],
    },
    hostel: { type: String, trim: true, default: "" },
    isAthlete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);