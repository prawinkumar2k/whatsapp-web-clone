import mongoose from 'mongoose';
import { sendError, normalizeText } from '../../utils/http.js';
import {
  createMessage,
  deleteOwnMessage,
  listDirectMessages,
  listGroupMessages,
  markDirectMessagesRead,
  reactToMessage,
} from './messages.service.js';

const hasValue = (value) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value);

export async function sendMessage(req, res) {
  try {
    const { senderId, receiverId, groupId, text, image, replyTo } = req.body;

    if (!mongoose.isValidObjectId(senderId)) {
      return sendError(res, 400, 'Valid senderId is required');
    }

    const hasDirectTarget = mongoose.isValidObjectId(receiverId);
    const hasGroupTarget = mongoose.isValidObjectId(groupId);

    if (!hasDirectTarget && !hasGroupTarget) {
      return sendError(res, 400, 'receiverId or groupId is required');
    }

    if (hasDirectTarget && hasGroupTarget) {
      return sendError(res, 400, 'Send either to a user or a group, not both');
    }

    const trimmedText = normalizeText(text);
    const hasImage = hasValue(image);

    if (!trimmedText && !hasImage) {
      return sendError(res, 400, 'Message must have text or image');
    }

    if (replyTo && !mongoose.isValidObjectId(replyTo)) {
      return sendError(res, 400, 'replyTo must be a valid message id');
    }

    const fullMessage = await createMessage({
      senderId,
      receiverId: hasDirectTarget ? receiverId : null,
      groupId: hasGroupTarget ? groupId : null,
      text: trimmedText,
      image: hasImage ? image : null,
      replyTo,
    });

    return res.status(201).json(fullMessage);
  } catch (error) {
    console.error('Failed to create message:', error);
    return sendError(res, error.statusCode || 500, error.message || 'Server error');
  }
}

export async function getConversationMessages(req, res) {
  try {
    const { senderId, receiverId } = req.params;

    if (!mongoose.isValidObjectId(senderId) || !mongoose.isValidObjectId(receiverId)) {
      return sendError(res, 400, 'Valid senderId and receiverId are required');
    }

    const messages = await listDirectMessages(senderId, receiverId);
    return res.json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function getGroupMessages(req, res) {
  try {
    const { groupId } = req.params;

    if (!mongoose.isValidObjectId(groupId)) {
      return sendError(res, 400, 'Valid groupId is required');
    }

    const messages = await listGroupMessages(groupId);
    return res.json(messages);
  } catch (error) {
    console.error('Failed to fetch group messages:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!mongoose.isValidObjectId(messageId) || !mongoose.isValidObjectId(userId)) {
      return sendError(res, 400, 'Valid messageId and userId are required');
    }

    const result = await deleteOwnMessage(messageId, userId);
    return res.json(result);
  } catch (error) {
    console.error('Failed to delete message:', error);
    return sendError(res, error.statusCode || 500, error.message || 'Server error');
  }
}

export async function markMessagesRead(req, res) {
  try {
    const { senderId, receiverId } = req.body;

    if (!mongoose.isValidObjectId(senderId) || !mongoose.isValidObjectId(receiverId)) {
      return sendError(res, 400, 'Valid senderId and receiverId are required');
    }

    const result = await markDirectMessagesRead(senderId, receiverId);
    return res.json(result);
  } catch (error) {
    console.error('Failed to mark messages read:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function react(req, res) {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    if (!emoji || typeof emoji !== 'string') {
      return sendError(res, 400, 'emoji is required');
    }

    const message = await reactToMessage({ messageId, userId, emoji });
    return res.json(message);
  } catch (error) {
    console.error('Failed to react to message:', error);
    return sendError(res, error.statusCode || 500, error.message || 'Server error');
  }
}
