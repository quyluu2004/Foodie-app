import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    reactions: {
      type: Map,
      of: [mongoose.Schema.Types.ObjectId],
      default: {},
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index để tối ưu query
chatMessageSchema.index({ conversation: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1, receiver: 1 });
chatMessageSchema.index({ isRead: 1 });

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Index để tối ưu query
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export const Conversation = mongoose.model("Conversation", conversationSchema);

