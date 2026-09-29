import { Router } from 'express';
import { MessageController } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.use(requireAuth);

router.get('/:conversationId', MessageController.getMessages);
router.post('/:conversationId', MessageController.sendMessage);
router.patch('/item/:messageId', MessageController.editMessage);
router.delete('/item/:messageId', MessageController.deleteMessage);
router.post('/item/:messageId/reaction', MessageController.toggleReaction);

// Upload endpoint
router.post('/upload/file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const url = `/uploads/${req.file.filename}`;
  return sendSuccess(
    res,
    {
      url,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
    'File uploaded successfully',
    201
  );
});

export default router;
