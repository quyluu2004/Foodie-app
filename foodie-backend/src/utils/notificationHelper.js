// Helper function to emit notification event via Socket.IO
export const emitNotificationEvent = (io, userId) => {
  if (io && userId) {
    // Emit to user's personal room
    io.to(`user:${userId}`).emit('newNotification');
    console.log(`📤 Emitted newNotification event to user:${userId}`);
  }
};

