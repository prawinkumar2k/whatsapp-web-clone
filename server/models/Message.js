import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema({
  senderId: { type: ObjectId, ref: 'User', required: true },
  receiverId: { type: ObjectId, ref: 'User', default: null },
  groupId: { type: ObjectId, ref: 'Group', default: null },
  text: { type: String, trim: true, default: '' },
  image: { type: String, default: null },
  replyTo: { type: ObjectId, ref: 'Message', default: null },
  reactions: [
    {
      userId: { type: ObjectId, ref: 'User', required: true },
      emoji: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
}, { timestamps: true });

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });
messageSchema.index({ groupId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
