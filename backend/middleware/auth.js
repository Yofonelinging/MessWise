import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authorized. No token." });

    const token = authHeader.split(" ")[1];

    // Admin token is just "true" (env-based login)
    if (token === "true") {
      req.user = { role: "admin" };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user)
      return res.status(401).json({ message: "User not found." });

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired." });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Admin access only." });
};