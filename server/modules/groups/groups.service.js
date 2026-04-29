import { Group } from '../../models/Group.js';
import { Message } from '../../models/Message.js';

export async function createGroup({ name, members, admin, description = '' }) {
  return Group.create({ name, members, admin, description });
}

export async function listGroupsForMember(userId) {
  return Group.find({ members: userId })
    .populate('members', 'username isOnline lastSeen')
    .populate('admin', 'username isOnline lastSeen')
    .sort({ updatedAt: -1 });
}

export async function addGroupMembers(groupId, members) {
  return Group.findByIdAndUpdate(
    groupId,
    { $addToSet: { members: { $each: members } } },
    { new: true }
  ).populate('members', 'username isOnline lastSeen').populate('admin', 'username isOnline lastSeen');
}

export async function removeGroupMembers(groupId, members) {
  return Group.findByIdAndUpdate(
    groupId,
    { $pull: { members: { $in: members } } },
    { new: true }
  ).populate('members', 'username isOnline lastSeen').populate('admin', 'username isOnline lastSeen');
}

export async function createGroupMessage({ senderId, groupId, text, image, replyTo }) {
  const message = await Message.create({
    senderId,
    groupId,
    text,
    image,
    replyTo: replyTo || null,
  });

  return Message.findById(message._id)
    .populate('senderId', 'username isOnline lastSeen')
    .populate('groupId', 'name members admin')
    .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'username' } });
}
