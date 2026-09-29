export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY';

export interface UserSummary {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  status?: string | null;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface UserProfile extends UserSummary {
  updatedAt: string;
}

export type ConversationType = 'DIRECT' | 'GROUP';
export type ConversationMemberRole = 'MEMBER' | 'ADMIN' | 'OWNER';

export interface ConversationMemberInfo {
  id: string;
  conversationId: string;
  userId: string;
  role: ConversationMemberRole;
  joinedAt: string;
  lastReadAt?: string | null;
  isMuted: boolean;
  isArchived: boolean;
  user: UserSummary;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface MessageReactionInfo {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: UserSummary;
}

export interface MessageAttachmentInfo {
  id: string;
  messageId: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface MessageInfo {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  replyToId?: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  sender: UserSummary;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    sender: UserSummary;
    deletedAt?: string | null;
  } | null;
  reactions: MessageReactionInfo[];
  attachments: MessageAttachmentInfo[];
  isPinned?: boolean;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  members: ConversationMemberInfo[];
  lastMessage?: MessageInfo | null;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  pinnedMessages?: PinnedMessageInfo[];
}

export interface PinnedMessageInfo {
  id: string;
  messageId: string;
  conversationId: string;
  pinnedBy: string;
  createdAt: string;
  message: MessageInfo;
  pinnedByUser?: UserSummary;
}

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

export interface UserConnectionInfo {
  id: string;
  senderId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
  sender: UserSummary;
  receiver: UserSummary;
}

export type NotificationType =
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'NEW_MESSAGE'
  | 'GROUP_INVITE'
  | 'GROUP_ADD'
  | 'GROUP_ROLE_UPDATE'
  | 'SYSTEM_ALERT';

export interface NotificationInfo {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string | null;
  createdAt: string;
}

// Socket Payloads
export interface TypingPayload {
  conversationId: string;
  userId: string;
  username: string;
  name: string;
}

export interface MessageDeliveryPayload {
  messageId: string;
  conversationId: string;
  userId: string;
  status: 'DELIVERED' | 'READ';
  timestamp: string;
}

export interface ReadReceiptPayload {
  conversationId: string;
  userId: string;
  lastReadAt: string;
}

export interface PresencePayload {
  userId: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeenAt?: string | null;
}

export interface ReactionSocketPayload {
  conversationId: string;
  messageId: string;
  userId: string;
  emoji: string;
  reaction?: MessageReactionInfo;
  action: 'ADD' | 'REMOVE';
}

// API Response generic structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore: boolean;
  total?: number;
}
