import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/search', UserController.searchUsers);
router.get('/connections', UserController.getConnections);
router.post('/connections', UserController.sendConnection);
router.patch('/connections/:connectionId', UserController.respondConnection);

export default router;
