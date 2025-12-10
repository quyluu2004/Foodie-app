import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "post_removed",
        "recipe_removed",
        "recipe_updated",
        "comment_removed",
        "post_approved",
        "recipe_approved",
        "follow",
        "like",
        "comment",
        "report_resolved",
        "admin_message",
        "report_pending",
        "user_promoted",
        "user_password_changed",
        "user_deleted",
        "rating_removed",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedType",
    },
    relatedType: {
      type: String,
      enum: ["Post", "Recipe", "Comment", null],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index để query nhanh
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);

