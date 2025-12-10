import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from handshake auth
 */
export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user info to socket
    socket.userId = user._id.toString();
    socket.user = user;
    
    next();
  } catch (error) {
    console.error("❌ Socket Auth Error:", error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

