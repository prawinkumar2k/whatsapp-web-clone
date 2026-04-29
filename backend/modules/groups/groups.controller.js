import mongoose from 'mongoose';
import { sendError } from '../../utils/http.js';
import { addGroupMembers, createGroup, listGroupsForMember, removeGroupMembers } from './groups.service.js';

export async function postGroup(req, res) {
  try {
    const { name, members = [], admin, description = '' } = req.body;

    if (!name || typeof name !== 'string') {
      return sendError(res, 400, 'Group name is required');
    }

    if (!mongoose.isValidObjectId(admin)) {
      return sendError(res, 400, 'Valid admin is required');
    }

    const normalizedMembers = [...new Set([admin, ...members].map(String))];
    if (normalizedMembers.length < 2) {
      return sendError(res, 400, 'Group needs at least two members');
    }

    const group = await createGroup({ name, members: normalizedMembers, admin, description });
    return res.status(201).json(group);
  } catch (error) {
    console.error('Failed to create group:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function getGroups(req, res) {
  try {
    const { memberId } = req.query;

    if (!mongoose.isValidObjectId(memberId)) {
      return sendError(res, 400, 'Valid memberId is required');
    }

    const groups = await listGroupsForMember(memberId);
    return res.json(groups);
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return sendError(res, 500, 'Server error');
  }
}

export async function patchGroupMembers(req, res) {
  try {
    const { groupId } = req.params;
    const { add = [], remove = [] } = req.body;

    if (!mongoose.isValidObjectId(groupId)) {
      return sendError(res, 400, 'Valid groupId is required');
    }

    let group = null;
    if (Array.isArray(add) && add.length) {
      group = await addGroupMembers(groupId, add.filter((id) => mongoose.isValidObjectId(id)));
    }
    if (Array.isArray(remove) && remove.length) {
      group = await removeGroupMembers(groupId, remove.filter((id) => mongoose.isValidObjectId(id)));
    }

    return res.json(group);
  } catch (error) {
    console.error('Failed to update group members:', error);
    return sendError(res, 500, 'Server error');
  }
}
