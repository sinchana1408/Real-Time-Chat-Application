import { prisma } from '../utils/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { UserSummary } from '@pulsechat/shared';

export class UserService {
  static async searchUsers(query: string, currentUserId: string) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { username: { contains: trimmed, mode: 'insensitive' } },
          { name: { contains: trimmed, mode: 'insensitive' } },
          { email: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
      take: 20,
    });

    // Also get connection status for each user relative to currentUserId
    const connections = await prisma.userConnection.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: { in: users.map((u) => u.id) } },
          { receiverId: currentUserId, senderId: { in: users.map((u) => u.id) } },
        ],
      },
    });

    const connMap = new Map<string, { status: string; connectionId: string; isSender: boolean }>();
    connections.forEach((c) => {
      const otherId = c.senderId === currentUserId ? c.receiverId : c.senderId;
      connMap.set(otherId, {
        status: c.status,
        connectionId: c.id,
        isSender: c.senderId === currentUserId,
      });
    });

    return users.map((u) => ({
      ...u,
      lastSeenAt: u.lastSeenAt ? u.lastSeenAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
      connection: connMap.get(u.id) || null,
    }));
  }

  static async sendConnection(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestError('Cannot send connection request to yourself');
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      throw new NotFoundError('Target user not found');
    }

    // Check existing
    const existing = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new BadRequestError('You are already connected with this user');
      }
      if (existing.status === 'PENDING') {
        throw new BadRequestError('A connection request is already pending between you');
      }
      // If rejected or cancelled, update to pending
      return prisma.userConnection.update({
        where: { id: existing.id },
        data: { status: 'PENDING', senderId, receiverId },
      });
    }

    return prisma.userConnection.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true },
        },
        receiver: {
          select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true },
        },
      },
    });
  }

  static async respondConnection(connectionId: string, userId: string, action: 'ACCEPT' | 'REJECT') {
    const connection = await prisma.userConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundError('Connection request not found');
    }

    if (connection.receiverId !== userId) {
      throw new BadRequestError('Only the receiver can respond to this request');
    }

    const updated = await prisma.userConnection.update({
      where: { id: connectionId },
      data: {
        status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
      },
    });

    return updated;
  }

  static async getConnections(userId: string) {
    const list = await prisma.userConnection.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, email: true, avatarUrl: true, status: true, lastSeenAt: true, createdAt: true },
        },
        receiver: {
          select: { id: true, name: true, username: true, email: true, avatarUrl: true, status: true, lastSeenAt: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return list.map((c) => ({
      id: c.id,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      isIncoming: c.receiverId === userId,
      user: c.senderId === userId ? c.receiver : c.sender,
    }));
  }
}
