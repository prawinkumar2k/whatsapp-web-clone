import express from 'express';
import { createOrFindUser, getUsers } from './users.controller.js';

const router = express.Router();

router.post('/', createOrFindUser);
router.get('/', getUsers);

export default router;
