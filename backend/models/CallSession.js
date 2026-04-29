import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const callSessionSchema = new mongoose.Schema(
  {
    initiatorId: { type: ObjectId, ref: 'User', required: true },
    receiverId: { type: ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['ringing', 'accepted', 'rejected', 'ended'],
      default: 'ringing',
    },
    callType: { type: String, enum: ['audio', 'video'], default: 'audio' },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

callSessionSchema.index({ initiatorId: 1, receiverId: 1, createdAt: -1 });

export const CallSession =
  mongoose.models.CallSession || mongoose.model('CallSession', callSessionSchema);
