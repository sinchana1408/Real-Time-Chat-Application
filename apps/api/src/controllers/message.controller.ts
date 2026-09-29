import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service.js';
import { sendSuccess } from '../utils/response.js';

export class MessageController {
  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.conversationId as string;
      const cursor = (req.query.cursor as string) || undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const result = await MessageService.getMessages(conversationId, req.user!.id, cursor, limit);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.conversationId as string;
      const { content, type, replyToId, attachments } = req.body;

      const message = await MessageService.sendMessage({
        conversationId,
        senderId: req.user!.id,
        content,
        type,
        replyToId,
        attachments,
      });

      return sendSuccess(res, message, 'Message sent', 201);
    } catch (err) {
      next(err);
    }
  }

  static async editMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const messageId = req.params.messageId as string;
      const { content } = req.body;
      const updated = await MessageService.editMessage(messageId, req.user!.id, content);
      return sendSuccess(res, updated, 'Message edited');
    } catch (err) {
      next(err);
    }
  }

  static async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const messageId = req.params.messageId as string;
      const result = await MessageService.deleteMessage(messageId, req.user!.id);
      return sendSuccess(res, result, 'Message deleted');
    } catch (err) {
      next(err);
    }
  }

  static async toggleReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const messageId = req.params.messageId as string;
      const { emoji } = req.body;
      const result = await MessageService.toggleReaction(messageId, req.user!.id, emoji);
      return sendSuccess(res, result, `Reaction ${result.action.toLowerCase()}ed`);
    } catch (err) {
      next(err);
    }
  }
}
