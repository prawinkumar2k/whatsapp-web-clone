import { User } from '../../models/User.js';
import { normalizeUsername } from '../../utils/http.js';

export async function upsertUserByUsername(username) {
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername) {
    throw new Error('Username is required');
  }

  if (normalizedUsername.length > 32) {
    const error = new Error('Username must be 32 characters or fewer');
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({ username: normalizedUsername });

  if (!user) {
    user = await User.create({ username: normalizedUsername });
  }

  return user;
}

export async function listUsers() {
  return User.find().sort({ createdAt: -1 });
}

export async function setUserPresence(userId, isOnline) {
  if (!userId) return null;

  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        isOnline,
        lastSeen: isOnline ? null : new Date(),
      },
    },
    { new: true }
  );
}
