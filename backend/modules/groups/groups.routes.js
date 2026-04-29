import express from 'express';
import { getGroups, patchGroupMembers, postGroup } from './groups.controller.js';

const router = express.Router();

router.get('/', getGroups);
router.post('/', postGroup);
router.patch('/:groupId/members', patchGroupMembers);

export default router;
