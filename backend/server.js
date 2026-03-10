import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import menuRoutes from "./routes/menu.js";
import mealDataRoutes from "./routes/mealData.js";
import analyticsRoutes from "./routes/analytics.js";
import ratingsRoutes from "./routes/ratings.js";
import predictionRoutes from "./routes/prediction.js";
import fatigueRoutes from "./routes/fatigue.js";
import nutritionRoutes from "./routes/nutrition.js";
import decisionsRoutes from "./routes/decisions.js";
import gamificationRoutes from "./routes/gamification.js";
import wasteIntelRoutes from "./routes/wasteIntelligence.js";
import supplyChainRoutes from "./routes/supplyChain.js";
import feedbackRoutes from "./routes/feedback.js";

dotenv.config();

const app = express();

// Connect DB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/meal-data", mealDataRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/rating", ratingsRoutes);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/fatigue", fatigueRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/decisions", decisionsRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/waste-intel", wasteIntelRoutes);
app.use("/api/supply-chain", supplyChainRoutes);
app.use("/api/feedback", feedbackRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Backend Running ✅");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));