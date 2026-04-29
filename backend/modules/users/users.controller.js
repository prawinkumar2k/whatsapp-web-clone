import { sendError, normalizeUsername } from '../../utils/http.js';
import { listUsers, upsertUserByUsername } from './users.service.js';

export async function createOrFindUser(req, res) {
  try {
    const normalizedUsername = normalizeUsername(req.body.username);

    if (!normalizedUsername) {
      return sendError(res, 400, 'Username is required');
    }

    const user = await upsertUserByUsername(normalizedUsername);
    return res.status(200).json(user);
  } catch (error) {
    console.error('Failed to create or find user:', error);
    return sendError(res, error.statusCode || 500, error.message || 'Server error');
  }
}

export async function getUsers(req, res) {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return sendError(res, 500, 'Server error');
  }
}
