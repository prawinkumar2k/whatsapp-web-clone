import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const statusSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String, required: true },
    caption: { type: String, trim: true, default: '' },
    viewedBy: [{ type: ObjectId, ref: 'User' }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

statusSchema.index({ userId: 1, createdAt: -1 });
statusSchema.index({ expiresAt: 1 });

export const Status = mongoose.models.Status || mongoose.model('Status', statusSchema);
