import mongoose from 'mongoose';
import { sendError } from '../../utils/http.js';
import { createStatus, listActiveStatuses, markStatusViewed } from './status.service.js';

export async function postStatus(req, res) {
  try {
    const { userId, mediaUrl, caption } = req.body;

    if (!mongoose.isValidObjectId(userId) || !mediaUrl) {
      return sendError(res, 400, 'Valid userId and mediaUrl are required');
    }

    const status = await createStatus({ userId, mediaUrl, caption });
    return res.status(201).json(status);
  } catch (error) {
    console.error('Failed to create status:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function getStatuses(req, res) {
  try {
    const statuses = await listActiveStatuses();
    return res.json(statuses);
  } catch (error) {
    console.error('Failed to fetch statuses:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function viewStatus(req, res) {
  try {
    const { statusId } = req.params;
    const { viewerId } = req.body;

    if (!mongoose.isValidObjectId(statusId) || !mongoose.isValidObjectId(viewerId)) {
      return sendError(res, 400, 'Valid statusId and viewerId are required');
    }

    const status = await markStatusViewed(statusId, viewerId);
    return res.json(status);
  } catch (error) {
    console.error('Failed to mark status viewed:', error);
    return sendError(res, 500, 'Server error');
  }
}
