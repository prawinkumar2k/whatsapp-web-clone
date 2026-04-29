import { Status } from '../../models/Status.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function createStatus({ userId, mediaUrl, caption = '' }) {
  const status = await Status.create({
    userId,
    mediaUrl,
    caption,
    expiresAt: new Date(Date.now() + DAY_MS),
  });

  return Status.findById(status._id).populate('userId', 'username isOnline lastSeen');
}

export async function listActiveStatuses() {
  const now = new Date();
  return Status.find({ expiresAt: { $gt: now } })
    .populate('userId', 'username isOnline lastSeen')
    .sort({ createdAt: -1 });
}

export async function markStatusViewed(statusId, viewerId) {
  return Status.findByIdAndUpdate(
    statusId,
    { $addToSet: { viewedBy: viewerId } },
    { new: true }
  ).populate('userId', 'username isOnline lastSeen');
}
