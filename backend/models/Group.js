import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    members: [{ type: ObjectId, ref: 'User', required: true }],
    admin: { type: ObjectId, ref: 'User', required: true },
    description: { type: String, trim: true, default: '' },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

groupSchema.index({ members: 1, createdAt: -1 });

export const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);
