import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    imageUrl: String,
    slug: { type: String, unique: true, sparse: true }
  },
  { timestamps: true }
);

// Tạo slug từ name nếu chưa có
categorySchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export default mongoose.model("Category", categorySchema);

