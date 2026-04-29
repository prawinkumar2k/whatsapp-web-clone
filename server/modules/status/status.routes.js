import express from 'express';
import { getStatuses, postStatus, viewStatus } from './status.controller.js';

const router = express.Router();

router.get('/', getStatuses);
router.post('/', postStatus);
router.post('/:statusId/view', viewStatus);

export default router;
