import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversation.service.js';
import { sendSuccess } from '../utils/response.js';

export class ConversationController {
  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await ConversationService.getUserConversations(req.user!.id);
      return sendSuccess(res, list);
    } catch (err) {
      next(err);
    }
  }

  static async createDirect(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipientId } = req.body;
      const conv = await ConversationService.createDirectConversation(req.user!.id, recipientId);
      return sendSuccess(res, conv, 'Conversation ready', 201);
    } catch (err) {
      next(err);
    }
  }

  static async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, memberIds, avatarUrl } = req.body;
      const group = await ConversationService.createGroupConversation(req.user!.id, name, memberIds, avatarUrl);
      return sendSuccess(res, group, 'Group conversation created', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const conv = await ConversationService.getConversationById(id, req.user!.id);
      return sendSuccess(res, conv);
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await ConversationService.markAsRead(id, req.user!.id);
      return sendSuccess(res, null, 'Marked as read');
    } catch (err) {
      next(err);
    }
  }

  static async toggleMute(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await ConversationService.toggleMute(id, req.user!.id);
      return sendSuccess(res, updated, 'Mute toggled');
    } catch (err) {
      next(err);
    }
  }

  static async toggleArchive(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updated = await ConversationService.toggleArchive(id, req.user!.id);
      return sendSuccess(res, updated, 'Archive toggled');
    } catch (err) {
      next(err);
    }
  }
}
