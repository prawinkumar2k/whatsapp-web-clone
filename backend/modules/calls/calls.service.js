import { CallSession } from '../../models/CallSession.js';

export async function createCallSession({ initiatorId, receiverId, callType = 'audio' }) {
  const session = await CallSession.create({ initiatorId, receiverId, callType });
  return CallSession.findById(session._id)
    .populate('initiatorId', 'username isOnline lastSeen')
    .populate('receiverId', 'username isOnline lastSeen');
}

export async function updateCallSessionStatus(sessionId, status) {
  return CallSession.findByIdAndUpdate(
    sessionId,
    {
      $set: {
        status,
        endedAt: status === 'ended' ? new Date() : null,
      },
    },
    { new: true }
  ).populate('initiatorId', 'username isOnline lastSeen').populate('receiverId', 'username isOnline lastSeen');
}

export async function listCallSessions(userId) {
  return CallSession.find({
    $or: [{ initiatorId: userId }, { receiverId: userId }],
  })
    .populate('initiatorId', 'username isOnline lastSeen')
    .populate('receiverId', 'username isOnline lastSeen')
    .sort({ createdAt: -1 })
    .limit(20);
}
