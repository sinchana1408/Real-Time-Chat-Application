export const SOCKET_EVENTS = {
  // Connection & Lifecycle
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',

  // Room / Conversation Lifecycle
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  CONVERSATION_UPDATED: 'conversation:updated',
  CONVERSATION_CREATED: 'conversation:created',

  // Messaging
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',

  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Reactions
  REACTION_ADD: 'reaction:add',
  REACTION_REMOVE: 'reaction:remove',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',

  // Pinning
  MESSAGE_PIN: 'message:pin',
  MESSAGE_UNPIN: 'message:unpin',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
