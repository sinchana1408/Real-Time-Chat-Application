import { create } from 'zustand';
import {
  ConversationSummary,
  MessageInfo,
  MessageType,
  SOCKET_EVENTS,
  TypingPayload,
  PresencePayload,
} from '@pulsechat/shared';
import { apiRequest } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';

interface ChatState {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: MessageInfo[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  onlineUserIds: Set<string>;
  typingUsers: Record<string, { userId: string; name: string }[]>; // conversationId -> users
  replyingTo: MessageInfo | null;

  // Actions
  fetchConversations: () => Promise<void>;
  selectConversation: (id: string | null) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, type?: MessageType, attachments?: any[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  setReplyingTo: (msg: MessageInfo | null) => void;
  sendTypingStatus: (isTyping: boolean) => void;
  createDirectChat: (recipientId: string) => Promise<string>;
  createGroupChat: (name: string, memberIds: string[]) => Promise<string>;
  initSocketListeners: (currentUserId: string, currentUserName: string) => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  onlineUserIds: new Set<string>(),
  typingUsers: {},
  replyingTo: null,

  setReplyingTo: (msg) => set({ replyingTo: msg }),

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const data = await apiRequest<ConversationSummary[]>('/conversations');
      set({ conversations: data, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  selectConversation: async (id) => {
    const prevId = get().activeConversationId;
    const socket = getSocket();

    if (prevId && socket.connected) {
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, prevId);
    }

    set({ activeConversationId: id, messages: [], replyingTo: null });

    if (id) {
      if (socket.connected) {
        socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, id);
      }
      // Mark as read in API and local state
      apiRequest(`/conversations/${id}/read`, { method: 'POST' }).catch(() => {});
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, unreadCount: 0 } : c
        ),
      }));

      await get().fetchMessages(id);
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoadingMessages: true });
    try {
      const res = await apiRequest<{ items: MessageInfo[] }>(`/messages/${conversationId}`);
      set({ messages: res.items, isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content, type = 'TEXT', attachments = []) => {
    const activeId = get().activeConversationId;
    if (!activeId) return;

    const replyToId = get().replyingTo?.id;
    const socket = getSocket();

    // Reset replying state
    set({ replyingTo: null });
    get().sendTypingStatus(false);

    // If socket is connected, emit socket message for instant delivery
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
        conversationId: activeId,
        content,
        type,
        replyToId,
        attachments,
      });
    } else {
      // Fallback to HTTP
      const msg = await apiRequest<MessageInfo>(`/messages/${activeId}`, {
        method: 'POST',
        body: JSON.stringify({ content, type, replyToId, attachments }),
      });
      set((state) => ({ messages: [...state.messages, msg] }));
    }
  },

  editMessage: async (messageId, content) => {
    const updated = await apiRequest<MessageInfo>(`/messages/item/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });

    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? updated : m)),
    }));
  },

  deleteMessage: async (messageId) => {
    await apiRequest(`/messages/item/${messageId}`, { method: 'DELETE' });
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, deletedAt: new Date().toISOString(), content: 'This message was deleted' }
          : m
      ),
    }));
  },

  toggleReaction: async (messageId, emoji) => {
    const activeId = get().activeConversationId;
    const socket = getSocket();

    if (activeId && socket.connected) {
      socket.emit(SOCKET_EVENTS.REACTION_ADD, {
        conversationId: activeId,
        messageId,
        emoji,
      });
    } else {
      await apiRequest(`/messages/item/${messageId}/reaction`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      if (activeId) {
        get().fetchMessages(activeId);
      }
    }
  },

  sendTypingStatus: (isTyping) => {
    const activeId = get().activeConversationId;
    const socket = getSocket();
    if (!activeId || !socket.connected) return;

    const event = isTyping ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP;
    socket.emit(event, { conversationId: activeId });
  },

  createDirectChat: async (recipientId) => {
    const conv = await apiRequest<ConversationSummary>('/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
    await get().fetchConversations();
    await get().selectConversation(conv.id);
    return conv.id;
  },

  createGroupChat: async (name, memberIds) => {
    const group = await apiRequest<ConversationSummary>('/conversations/group', {
      method: 'POST',
      body: JSON.stringify({ name, memberIds }),
    });
    await get().fetchConversations();
    await get().selectConversation(group.id);
    return group.id;
  },

  initSocketListeners: (_currentUserId, currentUserName) => {
    const socket = getSocket();

    // 1. Initial presence
    const onInitialPresence = (userIds: string[]) => {
      set({ onlineUserIds: new Set(userIds) });
    };

    // 2. Presence updates
    const onUserOnline = (payload: PresencePayload) => {
      set((state) => {
        const next = new Set(state.onlineUserIds);
        next.add(payload.userId);
        return { onlineUserIds: next };
      });
    };

    const onUserOffline = (payload: PresencePayload) => {
      set((state) => {
        const next = new Set(state.onlineUserIds);
        next.delete(payload.userId);
        return { onlineUserIds: next };
      });
    };

    // 3. New message received
    const onNewMessage = (message: MessageInfo) => {
      const activeId = get().activeConversationId;

      // Update message list if in active chat
      if (activeId === message.conversationId) {
        set((state) => {
          // Avoid duplicate
          if (state.messages.some((m) => m.id === message.id)) return state;
          return { messages: [...state.messages, message] };
        });
        // Mark as read in background
        apiRequest(`/conversations/${message.conversationId}/read`, { method: 'POST' }).catch(() => {});
      }

      // Update conversation lastMessage & unread count
      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c.id === message.conversationId) {
            return {
              ...c,
              lastMessage: message,
              unreadCount: activeId === c.id ? 0 : c.unreadCount + 1,
              updatedAt: message.createdAt,
            };
          }
          return c;
        }),
      }));
    };

    // 4. Typing indicators
    const onTypingStart = (payload: TypingPayload) => {
      set((state) => {
        const current = state.typingUsers[payload.conversationId] || [];
        if (current.some((u) => u.userId === payload.userId)) return state;
        return {
          typingUsers: {
            ...state.typingUsers,
            [payload.conversationId]: [...current, { userId: payload.userId, name: payload.name }],
          },
        };
      });
    };

    const onTypingStop = (payload: { conversationId: string; userId: string }) => {
      set((state) => {
        const current = state.typingUsers[payload.conversationId] || [];
        return {
          typingUsers: {
            ...state.typingUsers,
            [payload.conversationId]: current.filter((u) => u.userId !== payload.userId),
          },
        };
      });
    };

    // 5. Reaction update
    const onReactionUpdate = (data: { conversationId: string; messageId: string; action: string; reaction: any; userId: string; emoji: string }) => {
      set((state) => {
        if (state.activeConversationId !== data.conversationId) return state;
        return {
          messages: state.messages.map((m) => {
            if (m.id !== data.messageId) return m;
            let reactions = [...m.reactions];
            if (data.action === 'ADD' && data.reaction) {
              reactions.push(data.reaction);
            } else if (data.action === 'REMOVE') {
              reactions = reactions.filter((r) => !(r.userId === data.userId && r.emoji === data.emoji));
            }
            return { ...m, reactions };
          }),
        };
      });
    };

    socket.on('presence:initial', onInitialPresence);
    socket.on(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNewMessage);
    socket.on(SOCKET_EVENTS.TYPING_START, onTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
    socket.on('reaction:update', onReactionUpdate);

    return () => {
      socket.off('presence:initial', onInitialPresence);
      socket.off(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNewMessage);
      socket.off(SOCKET_EVENTS.TYPING_START, onTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
      socket.off('reaction:update', onReactionUpdate);
    };
  },
}));
