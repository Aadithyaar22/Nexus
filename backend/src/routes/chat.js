import { Router } from 'express';
import {
  sendMessage,
  listChats,
  getChat,
  deleteChat,
} from '../controllers/chatController.js';

const router = Router();

router.post('/message', sendMessage);
router.get('/', listChats);
router.get('/:id', getChat);
router.delete('/:id', deleteChat);

export default router;
