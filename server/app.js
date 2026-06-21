import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dressRoutes from "./routes/dress.js";
import jewelleryRoutes from "./routes/jewellery.js"
import adsRoutes from "./routes/ads.js"
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import reviewRoutes from "./routes/review.js";
import comboRoutes from "./routes/combo.js";
import recommendRoutes from './routes/recommend.js';
import searchRoutes from './routes/search.js';
import sizeRoutes from './routes/size.js';
import orderRoutes from './routes/orders.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';



dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (Atlas)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/dresses", dressRoutes);
app.use("/api/jewellery", jewelleryRoutes)
app.use("/api/ads", adsRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/combo", comboRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/size', sizeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("DAG API running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
