import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "USER_PROMOTED",
        "USER_DEMOTED",
        "USER_DELETED",
        "ROLE_CREATED",
        "ROLE_UPDATED",
        "ROLE_DELETED",
        "PERMISSION_GRANTED",
        "PERMISSION_REVOKED",
        "USER_PROJECT_ASSIGNED",
        "USER_PROJECT_REMOVED",
        "USER_ROLE_ASSIGNED",
        "USER_ROLE_REMOVED",
      ],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Có thể là user, role, hoặc project
    },
    targetType: {
      type: String,
      enum: ["user", "role", "project", "permission"],
      required: false,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed, // Lưu thay đổi chi tiết
      default: {},
    },
    reason: {
      type: String,
      required: false,
      maxlength: 500,
    },
    metadata: {
      ip: String,
      userAgent: String,
      timestamp: Date,
    },
  },
  { timestamps: true }
);

// Index để query nhanh
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ target: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);

