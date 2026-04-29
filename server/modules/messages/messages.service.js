import mongoose from 'mongoose';
import { Message } from '../../models/Message.js';

const populateMessageQuery = (query) =>
  query
    .populate('senderId', 'username isOnline lastSeen')
    .populate('receiverId', 'username isOnline lastSeen')
    .populate('groupId', 'name members admin')
    .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'username' } });

export async function createMessage({ senderId, receiverId = null, groupId = null, text, image, replyTo }) {
  const created = await Message.create({
    senderId,
    receiverId,
    groupId,
    text,
    image,
    replyTo: replyTo || null,
  });

  return populateMessageQuery(Message.findById(created._id));
}

export async function listDirectMessages(senderId, receiverId) {
  return populateMessageQuery(
    Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 })
  );
}

export async function listGroupMessages(groupId) {
  return populateMessageQuery(Message.find({ groupId }).sort({ createdAt: 1 }));
}

export async function deleteOwnMessage(messageId, userId) {
  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  if (String(message.senderId) !== String(userId)) {
    const error = new Error('You can only delete your own messages');
    error.statusCode = 403;
    throw error;
  }

  await Message.findByIdAndDelete(messageId);
  return { success: true, messageId };
}

export async function markDirectMessagesRead(senderId, receiverId) {
  const result = await Message.updateMany(
    { senderId, receiverId, status: { $ne: 'read' } },
    { $set: { status: 'read' } }
  );

  return { success: true, updatedCount: result.modifiedCount || 0 };
}

export async function reactToMessage({ messageId, userId, emoji }) {
  if (!mongoose.isValidObjectId(messageId) || !mongoose.isValidObjectId(userId)) {
    const error = new Error('Valid messageId and userId are required');
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  const reactionIndex = message.reactions.findIndex((reaction) => String(reaction.userId) === String(userId));

  if (reactionIndex >= 0 && message.reactions[reactionIndex].emoji === emoji) {
    message.reactions.splice(reactionIndex, 1);
  } else if (reactionIndex >= 0) {
    message.reactions[reactionIndex].emoji = emoji;
    message.reactions[reactionIndex].createdAt = new Date();
  } else {
    message.reactions.push({ userId, emoji });
  }

  await message.save();
  return populateMessageQuery(Message.findById(message._id));
}
