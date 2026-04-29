import { User } from '../models/User.js';
import { Group } from '../models/Group.js';

export const DEMO_USERS = ['alice', 'bob'];
export const DEMO_GROUP = 'demo circle';

export async function seedDemoUsers() {
  const existing = await User.find({ username: { $in: DEMO_USERS } }).select('_id username');
  const existingNames = new Set(existing.map((user) => user.username));

  const usersToCreate = DEMO_USERS
    .filter((username) => !existingNames.has(username))
    .map((username) => ({ username }));

  if (usersToCreate.length > 0) {
    await User.insertMany(usersToCreate, { ordered: false });
  }

  const seededUsers = await User.find({ username: { $in: DEMO_USERS } }).sort({ username: 1 });
  if (seededUsers.length >= 2) {
    const existingGroup = await Group.findOne({ name: DEMO_GROUP });
    if (!existingGroup) {
      await Group.create({
        name: DEMO_GROUP,
        members: seededUsers.map((user) => user._id),
        admin: seededUsers[0]._id,
        description: 'Starter group for the two-user demo',
      });
    }
  }

  return usersToCreate.length;
}
