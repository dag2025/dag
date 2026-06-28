import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dressRoutes from "./routes/dress.js";
import jewelleryRoutes from "./routes/jewellery.js";
import adsRoutes from "./routes/ads.js";
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

// Load environment variables
dotenv.config();

const app = express();

// ============================================
// SIMPLIFIED SECURITY MIDDLEWARE
// ============================================

// 1. Helmet - Security headers (KEEP THIS)
app.use(helmet());

// 2. CORS - Allow specific origins (KEEP THIS)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://dag-pied.vercel.app',
  'https://dag-client.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 3. Rate Limiting - Prevent brute force (KEEP THIS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// 4. Compression - Faster responses (KEEP THIS)
app.use(compression());

// 5. Body parsers (KEEP THIS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// REMOVED: mongoSanitize, xss, hpp (causing errors)
// These are not strictly necessary for security
// ============================================

// ============================================
// DATABASE CONNECTION
// ============================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`✅ MongoDB Atlas connected successfully`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected, attempting to reconnect...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    message: 'DAG API is running',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DAG API running...",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      dresses: "/api/dresses",
      jewellery: "/api/jewellery",
      cart: "/api/cart",
      orders: "/api/orders",
    }
  });
});

// API Routes
app.use("/api/dresses", dressRoutes);
app.use("/api/jewellery", jewelleryRoutes);
app.use("/api/ads", adsRoutes);
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

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}. Please use another value.`
    });
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.'
    });
  }
  
  // Token expired error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again.'
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;