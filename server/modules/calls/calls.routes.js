import express from 'express';
import { getCalls, patchCall, postCall } from './calls.controller.js';

const router = express.Router();

router.get('/', getCalls);
router.post('/', postCall);
router.patch('/:callId', patchCall);

export default router;
