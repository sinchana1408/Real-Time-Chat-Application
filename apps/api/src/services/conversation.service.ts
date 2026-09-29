import { prisma } from '../utils/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { ConversationSummary, ConversationType } from '@pulsechat/shared';

export class ConversationService {
  static async getUserConversations(userId: string): Promise<ConversationSummary[]> {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
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
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true },
                },
                reactions: {
                  include: {
                    user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
                  },
                },
                attachments: true,
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const result: ConversationSummary[] = [];

    for (const m of memberships) {
      const conv = m.conversation;
      const lastMsg = conv.messages[0] || null;

      // Unread count: messages newer than membership.lastReadAt, not sent by this user
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          createdAt: { gt: m.lastReadAt || new Date(0) },
          deletedAt: null,
        },
      });

      result.push({
        id: conv.id,
        type: conv.type as ConversationType,
        name: conv.name,
        avatarUrl: conv.avatarUrl,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        isMuted: m.isMuted,
        isArchived: m.isArchived,
        unreadCount,
        members: conv.members.map((mem) => ({
          id: mem.id,
          conversationId: mem.conversationId,
          userId: mem.userId,
          role: mem.role as any,
          joinedAt: mem.joinedAt.toISOString(),
          lastReadAt: mem.lastReadAt ? mem.lastReadAt.toISOString() : null,
          isMuted: mem.isMuted,
          isArchived: mem.isArchived,
          user: {
            ...mem.user,
            lastSeenAt: mem.user.lastSeenAt ? mem.user.lastSeenAt.toISOString() : null,
            createdAt: mem.user.createdAt.toISOString(),
          },
        })),
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: lastMsg.conversationId,
              senderId: lastMsg.senderId,
              content: lastMsg.content,
              type: lastMsg.type as any,
              replyToId: lastMsg.replyToId,
              createdAt: lastMsg.createdAt.toISOString(),
              updatedAt: lastMsg.updatedAt.toISOString(),
              editedAt: lastMsg.editedAt ? lastMsg.editedAt.toISOString() : null,
              deletedAt: lastMsg.deletedAt ? lastMsg.deletedAt.toISOString() : null,
              sender: {
                ...lastMsg.sender,
                createdAt: lastMsg.sender.createdAt.toISOString(),
              },
              reactions: lastMsg.reactions.map((r) => ({
                id: r.id,
                messageId: r.messageId,
                userId: r.userId,
                emoji: r.emoji,
                createdAt: r.createdAt.toISOString(),
                user: r.user ? { ...r.user, createdAt: r.user.createdAt.toISOString() } : undefined,
              })),
              attachments: lastMsg.attachments.map((a) => ({
                id: a.id,
                messageId: a.messageId,
                url: a.url,
                filename: a.filename,
                mimeType: a.mimeType,
                size: a.size,
                createdAt: a.createdAt.toISOString(),
              })),
            }
          : null,
      });
    }

    return result;
  }

  static async createDirectConversation(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestError('Cannot start a direct conversation with yourself');
    }

    // Check if direct conversation already exists between these 2 users
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new direct conversation
    const newConv = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [
            { userId, role: 'MEMBER' },
            { userId: recipientId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true },
            },
          },
        },
      },
    });

    return newConv;
  }

  static async createGroupConversation(userId: string, name: string, memberIds: string[], avatarUrl?: string | null) {
    const allMembers = Array.from(new Set([userId, ...memberIds]));
    if (allMembers.length < 2) {
      throw new BadRequestError('A group must have at least 2 members');
    }

    const conv = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        name,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        members: {
          create: allMembers.map((id) => ({
            userId: id,
            role: id === userId ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
          },
        },
      },
    });

    // Create initial system message
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: userId,
        content: `created the group "${name}"`,
        type: 'SYSTEM',
      },
    });

    return conv;
  }

  static async getConversationById(conversationId: string, userId: string) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member) {
      throw new ForbiddenError('You are not a member of this conversation');
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
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
            },
          },
        },
        pinnedMessages: {
          include: {
            message: {
              include: {
                sender: { select: { id: true, name: true, username: true, avatarUrl: true, email: true, createdAt: true } },
                reactions: true,
                attachments: true,
              },
            },
            user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
          },
        },
      },
    });

    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    return conv;
  }

  static async markAsRead(conversationId: string, userId: string) {
    return prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
  }

  static async toggleMute(conversationId: string, userId: string) {
    const mem = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!mem) throw new NotFoundError('Member record not found');

    return prisma.conversationMember.update({
      where: { id: mem.id },
      data: { isMuted: !mem.isMuted },
    });
  }

  static async toggleArchive(conversationId: string, userId: string) {
    const mem = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!mem) throw new NotFoundError('Member record not found');

    return prisma.conversationMember.update({
      where: { id: mem.id },
      data: { isArchived: !mem.isArchived },
    });
  }
}
