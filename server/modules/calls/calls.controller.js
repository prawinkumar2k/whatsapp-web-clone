import mongoose from 'mongoose';
import { sendError } from '../../utils/http.js';
import { createCallSession, listCallSessions, updateCallSessionStatus } from './calls.service.js';

export async function postCall(req, res) {
  try {
    const { initiatorId, receiverId, callType } = req.body;

    if (!mongoose.isValidObjectId(initiatorId) || !mongoose.isValidObjectId(receiverId)) {
      return sendError(res, 400, 'Valid initiatorId and receiverId are required');
    }

    const session = await createCallSession({ initiatorId, receiverId, callType });
    return res.status(201).json(session);
  } catch (error) {
    console.error('Failed to create call session:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function getCalls(req, res) {
  try {
    const { userId } = req.query;

    if (!mongoose.isValidObjectId(userId)) {
      return sendError(res, 400, 'Valid userId is required');
    }

    const calls = await listCallSessions(userId);
    return res.json(calls);
  } catch (error) {
    console.error('Failed to fetch call sessions:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function patchCall(req, res) {
  try {
    const { callId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(callId)) {
      return sendError(res, 400, 'Valid callId is required');
    }

    if (!['accepted', 'rejected', 'ended'].includes(status)) {
      return sendError(res, 400, 'Valid status is required');
    }

    const session = await updateCallSessionStatus(callId, status);
    return res.json(session);
  } catch (error) {
    console.error('Failed to update call session:', error);
    return sendError(res, 500, 'Server error');
  }
}
