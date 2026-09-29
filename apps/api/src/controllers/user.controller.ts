import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export class UserController {
  static async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const results = await UserService.searchUsers(q, req.user!.id);
      return sendSuccess(res, results);
    } catch (err) {
      next(err);
    }
  }

  static async sendConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const { receiverId } = req.body;
      const result = await UserService.sendConnection(req.user!.id, receiverId);
      return sendSuccess(res, result, 'Connection request sent', 201);
    } catch (err) {
      next(err);
    }
  }

  static async respondConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const connectionId = req.params.connectionId as string;
      const { action } = req.body;
      const result = await UserService.respondConnection(connectionId, req.user!.id, action);
      return sendSuccess(res, result, `Connection request ${action.toLowerCase()}ed`);
    } catch (err) {
      next(err);
    }
  }

  static async getConnections(req: Request, res: Response, next: NextFunction) {
    try {
      const connections = await UserService.getConnections(req.user!.id);
      return sendSuccess(res, connections);
    } catch (err) {
      next(err);
    }
  }
}
