import { prisma } from '../utils/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { MessageInfo, MessageType } from '@pulsechat/shared';

export class MessageService {
  static async sendMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    type?: MessageType;
    replyToId?: string | null;
    attachments?: Array<{ url: string; filename: string; mimeType: string; size: number }>;
  }): Promise<MessageInfo> {
    const { conversationId, senderId, content, type = 'TEXT', replyToId, attachments = [] } = params;

    // Verify sender belongs to conversation
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!member) {
      throw new ForbiddenError('You are not a member of this conversation');
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type: type as any,
        replyToId: replyToId || undefined,
        attachments: {
          create: attachments.map((att) => ({
            url: att.url,
            filename: att.filename,
            mimeType: att.mimeType,
            size: att.size,
          })),
        },
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            deletedAt: true,
            sender: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
          },
        },
        attachments: true,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type as any,
      replyToId: message.replyToId,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      editedAt: message.editedAt ? message.editedAt.toISOString() : null,
      deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
      sender: {
        ...message.sender,
        createdAt: message.sender.createdAt.toISOString(),
      },
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.deletedAt ? 'This message was deleted' : message.replyTo.content,
            senderId: message.replyTo.senderId,
            deletedAt: message.replyTo.deletedAt ? message.replyTo.deletedAt.toISOString() : null,
            sender: {
              ...message.replyTo.sender,
              createdAt: message.replyTo.sender.createdAt.toISOString(),
            },
          }
        : null,
      reactions: message.reactions.map((r) => ({
        id: r.id,
        messageId: r.messageId,
        userId: r.userId,
        emoji: r.emoji,
        createdAt: r.createdAt.toISOString(),
        user: r.user ? { ...r.user, createdAt: r.user.createdAt.toISOString() } : undefined,
      })),
      attachments: message.attachments.map((a) => ({
        id: a.id,
        messageId: a.messageId,
        url: a.url,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  static async getMessages(conversationId: string, userId: string, cursor?: string, limit: number = 30) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) {
      throw new ForbiddenError('You are not a member of this conversation');
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            deletedAt: true,
            sender: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
          },
        },
        attachments: true,
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Format and reverse so client gets chronological order
    const formatted = items.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.deletedAt ? 'This message was deleted' : m.content,
      type: m.type as any,
      replyToId: m.replyToId,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      editedAt: m.editedAt ? m.editedAt.toISOString() : null,
      deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
      sender: {
        ...m.sender,
        createdAt: m.sender.createdAt.toISOString(),
      },
      replyTo: m.replyTo
        ? {
            id: m.replyTo.id,
            content: m.replyTo.deletedAt ? 'This message was deleted' : m.replyTo.content,
            senderId: m.replyTo.senderId,
            deletedAt: m.replyTo.deletedAt ? m.replyTo.deletedAt.toISOString() : null,
            sender: {
              ...m.replyTo.sender,
              createdAt: m.replyTo.sender.createdAt.toISOString(),
            },
          }
        : null,
      reactions: m.reactions.map((r) => ({
        id: r.id,
        messageId: r.messageId,
        userId: r.userId,
        emoji: r.emoji,
        createdAt: r.createdAt.toISOString(),
        user: r.user ? { ...r.user, createdAt: r.user.createdAt.toISOString() } : undefined,
      })),
      attachments: m.attachments.map((a) => ({
        id: a.id,
        messageId: a.messageId,
        url: a.url,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: a.createdAt.toISOString(),
      })),
    }));

    return {
      items: formatted.reverse(),
      nextCursor,
      hasMore,
    };
  }

  static async editMessage(messageId: string, userId: string, content: string): Promise<MessageInfo> {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
        reactions: { include: { user: true } },
        attachments: true,
      },
    });

    if (!existing) throw new NotFoundError('Message not found');
    if (existing.senderId !== userId) throw new ForbiddenError('You can only edit your own messages');
    if (existing.deletedAt) throw new BadRequestError('Cannot edit a deleted message');

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        editedAt: new Date(),
      },
      include: {
        sender: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
        reactions: {
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
        attachments: true,
      },
    });

    return {
      id: updated.id,
      conversationId: updated.conversationId,
      senderId: updated.senderId,
      content: updated.content,
      type: updated.type as any,
      replyToId: updated.replyToId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      editedAt: updated.editedAt ? updated.editedAt.toISOString() : null,
      deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
      sender: {
        ...updated.sender,
        createdAt: updated.sender.createdAt.toISOString(),
      },
      reactions: updated.reactions.map((r) => ({
        id: r.id,
        messageId: r.messageId,
        userId: r.userId,
        emoji: r.emoji,
        createdAt: r.createdAt.toISOString(),
        user: r.user
          ? {
              ...r.user,
              lastSeenAt: r.user.lastSeenAt ? r.user.lastSeenAt.toISOString() : null,
              createdAt: r.user.createdAt.toISOString(),
            }
          : undefined,
      })),
      attachments: updated.attachments.map((a) => ({
        id: a.id,
        messageId: a.messageId,
        url: a.url,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  static async deleteMessage(messageId: string, userId: string) {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { members: true } } },
    });

    if (!existing) throw new NotFoundError('Message not found');

    const member = existing.conversation.members.find((m) => m.userId === userId);
    const isSender = existing.senderId === userId;
    const isAdmin = member?.role === 'ADMIN' || member?.role === 'OWNER';

    if (!isSender && !isAdmin) {
      throw new ForbiddenError('You do not have permission to delete this message');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: 'This message was deleted',
      },
    });

    return {
      id: updated.id,
      conversationId: updated.conversationId,
      deletedAt: updated.deletedAt?.toISOString(),
    };
  }

  static async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
      return { action: 'REMOVE', reaction: null, emoji, messageId, userId };
    }

    const reaction = await prisma.messageReaction.create({
      data: { messageId, userId, emoji },
      include: {
        user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true, createdAt: true } },
      },
    });

    return {
      action: 'ADD',
      reaction: {
        id: reaction.id,
        messageId: reaction.messageId,
        userId: reaction.userId,
        emoji: reaction.emoji,
        createdAt: reaction.createdAt.toISOString(),
        user: { ...reaction.user, createdAt: reaction.user.createdAt.toISOString() },
      },
      emoji,
      messageId,
      userId,
    };
  }
}
