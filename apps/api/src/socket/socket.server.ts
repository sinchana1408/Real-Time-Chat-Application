import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import cookie from 'cookie';
import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';
import { SOCKET_EVENTS, TypingPayload, PresencePayload } from '@pulsechat/shared';
import { MessageService } from '../services/message.service.js';
import { env } from '../config/env.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

// Map userId -> Set of socket IDs (to support multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>();

export function setupSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      let token: string | undefined;

      // 1. From handshake auth object
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }
      // 2. From cookies
      else if (socket.handshake.headers.cookie) {
        const parsed = cookie.parse(socket.handshake.headers.cookie);
        token = parsed.token;
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err: any) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;

    // 1. Track online presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Broadcast presence online to everyone
    const onlinePayload: PresencePayload = {
      userId,
      status: 'ONLINE',
      lastSeenAt: new Date().toISOString(),
    };
    io.emit(SOCKET_EVENTS.USER_ONLINE, onlinePayload);

    // Send current list of online user IDs to the connected socket
    const activeOnlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('presence:initial', activeOnlineUserIds);

    // 2. Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // 3. Conversation Join/Leave
    socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_LEAVE, (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // 4. Send Message via Socket
    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (data: any, callback?: Function) => {
      try {
        const { conversationId, content, type = 'TEXT', replyToId, attachments } = data;
        const message = await MessageService.sendMessage({
          conversationId,
          senderId: userId,
          content,
          type,
          replyToId,
          attachments,
        });

        // Broadcast to everyone in conversation room
        io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message);

        if (callback) callback({ success: true, data: message });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 5. Typing Indicators
    socket.on(SOCKET_EVENTS.TYPING_START, (payload: { conversationId: string; name: string }) => {
      socket.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.TYPING_START, {
        conversationId: payload.conversationId,
        userId,
        username,
        name: payload.name || username,
      });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, (payload: { conversationId: string }) => {
      socket.to(`conversation:${payload.conversationId}`).emit(SOCKET_EVENTS.TYPING_STOP, {
        conversationId: payload.conversationId,
        userId,
      });
    });

    // 6. Reactions
    socket.on(SOCKET_EVENTS.REACTION_ADD, async (data: { messageId: string; conversationId: string; emoji: string }) => {
      try {
        const result = await MessageService.toggleReaction(data.messageId, userId, data.emoji);
        io.to(`conversation:${data.conversationId}`).emit('reaction:update', {
          conversationId: data.conversationId,
          ...result,
        });
      } catch (err) {
        // silently catch
      }
    });

    // 7. Read Receipts
    socket.on(SOCKET_EVENTS.MESSAGE_READ, (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_READ, {
        conversationId: data.conversationId,
        userId,
        lastReadAt: new Date().toISOString(),
      });
    });

    // 8. Disconnect
    socket.on('disconnect', async () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          // Update lastSeenAt in DB
          await prisma.user.update({
            where: { id: userId },
            data: { lastSeenAt: new Date() },
          }).catch(() => {});

          const offlinePayload: PresencePayload = {
            userId,
            status: 'OFFLINE',
            lastSeenAt: new Date().toISOString(),
          };
          io.emit(SOCKET_EVENTS.USER_OFFLINE, offlinePayload);
        }
      }
    });
  });

  return io;
}
