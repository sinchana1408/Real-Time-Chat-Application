import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', ConversationController.getConversations);
router.post('/direct', ConversationController.createDirect);
router.post('/group', ConversationController.createGroup);
router.get('/:id', ConversationController.getById);
router.post('/:id/read', ConversationController.markRead);
router.patch('/:id/mute', ConversationController.toggleMute);
router.patch('/:id/archive', ConversationController.toggleArchive);

export default router;
