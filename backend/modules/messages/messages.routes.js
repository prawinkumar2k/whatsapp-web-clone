import express from 'express';
import {
  deleteMessage,
  getConversationMessages,
  getGroupMessages,
  markMessagesRead,
  react,
  sendMessage,
} from './messages.controller.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/group/:groupId', getGroupMessages);
router.get('/:senderId/:receiverId', getConversationMessages);
router.delete('/:messageId', deleteMessage);
router.post('/read', markMessagesRead);
router.patch('/:messageId/reactions', react);

export default router;
