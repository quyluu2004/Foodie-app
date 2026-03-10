// ⚠️ QUAN TRỌNG: PHẢI import env.js ĐẦU TIÊN để load dotenv trước khi import bất kỳ module nào
import './config/env.js';

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { socketAuth } from "./middleware/socketAuth.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import { enforceHttps, additionalSecurityHeaders } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiLimiter, authLimiter, aiLimiter, uploadLimiter } from "./middleware/rateLimiter.js";

import authRoutes from "./routes/auth.routes.js";
import recipeRoutes from "./routes/recipe.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import postRoutes from "./routes/post.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import followRoutes from "./routes/follow.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import likeRoutes from "./routes/like.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import savedRoutes from "./routes/saved.routes.js";
import reportRoutes from "./routes/report.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import messageRoutes from "./routes/message.routes.js";
import homepageRoutes from "./routes/homepage.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import creatorRequestRoutes from "./routes/creatorRequest.routes.js";
import premiumRoutes from "./routes/premium.routes.js";

// Env validation đã xử lý trong config/env.js

const app = express();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '10mb' }));

// 🔐 HTTPS enforcement (chỉ production)
app.use(enforceHttps);

// 🔐 Security headers bổ sung
app.use(additionalSecurityHeaders);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'])
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// 🔐 XSS Sanitization cho tất cả input
app.use(sanitizeInput);

// Logging - chỉ dev
if (process.env.NODE_ENV === 'development') {
  app.use(morgan("dev"));
}

// 🔒 Rate Limiting — Bảo vệ API khỏi abuse
app.use("/api", apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get("/", (_, res) => res.send("Foodie API đang hoạt động!"));

// Route /api để hiển thị thông tin các endpoints
app.get("/api", (_, res) => {
  res.json({
    message: "Foodie API đang hoạt động!",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      recipes: "/api/recipes",
      favorites: "/api/favorites",
      posts: "/api/posts",
      stats: "/api/stats",
      follow: "/api/follow",
      categories: "/api/categories",
      like: "/api/like",
      comment: "/api/comment",
      save: "/api/save",
      reports: "/api/reports",
      notifications: "/api/notifications",
      messages: "/api/messages",
      ai: "/api/ai"
    },
    baseUrl: "http://localhost:8080"
  });
});

// 🔒 Rate Limiting cho auth
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);

// 🔒 Rate Limiting cho AI
app.use("/api/ai", aiLimiter);
app.use("/api/ai", aiRoutes);

// Các routes khác
app.use("/api/recipes", recipeRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/like", likeRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/creator-requests", creatorRequestRoutes);
app.use("/api/premium", premiumRoutes);

// 🔐 Centralized Error Handling (phải đặt sau tất cả routes)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

connectDB(process.env.MONGO_URI).then(() => {
  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'])
        : '*',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true // Allow Engine.IO v3 clients
  });

  // Socket.IO authentication middleware
  io.use(socketAuth);

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Socket connected: User ${userId}`);
    }

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle joining conversation room
    socket.on('joinConversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    // Handle leaving conversation room
    socket.on('leaveConversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ Socket disconnected: User ${userId} (${reason})`);
      }
    });
  });

  // Make io available globally for use in controllers
  app.set('io', io);

  // Bind to 0.0.0.0 so external devices on the LAN can connect
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang chạy tại http://0.0.0.0:${PORT}`);
    console.log(`🔌 Socket.IO server đã sẵn sàng`);
  });

  // Xử lý lỗi EADDRINUSE
  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Lỗi: Port ${PORT} đã được sử dụng!`);
      console.error(`💡 Giải pháp:`);
      console.error(`   1. Chạy script dọn dẹp: .\\cleanup.ps1`);
      console.error(`   2. Hoặc kill process: netstat -ano | findstr :${PORT}`);
      console.error(`   3. Hoặc thay đổi PORT trong file .env\n`);
      process.exit(1);
    } else {
      console.error('❌ Lỗi server:', err);
      process.exit(1);
    }
  });
});