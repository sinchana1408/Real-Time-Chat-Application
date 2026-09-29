import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  Settings,
  Users,
  CheckCheck,
  Check,
  Circle,
  MoreVertical,
} from 'lucide-react';
import { Avatar } from '../common/Avatar.js';
import { useChatStore } from '../../store/useChatStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { formatRelativeDate } from '../../lib/utils.js';

interface SidebarProps {
  onOpenNewChat: () => void;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNewChat, onOpenProfile }) => {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    selectConversation,
    onlineUserIds,
    isLoadingConversations,
  } = useChatStore();

  const [filterQuery, setFilterQuery] = useState('');

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    if (c.type === 'GROUP') {
      return c.name?.toLowerCase().includes(q);
    }
    const otherMember = c.members.find((m) => m.userId !== user?.id);
    return (
      otherMember?.user.name.toLowerCase().includes(q) ||
      otherMember?.user.username.toLowerCase().includes(q)
    );
  });

  return (
    <aside className="w-80 sm:w-88 md:w-96 flex-shrink-0 border-r bg-chat-sidebar flex flex-col h-full select-none">
      {/* Top Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95a1 1 0 0 0 1.258 1.258l4.782-1.388A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-foreground flex items-center gap-1.5">
              PulseChat
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] text-muted-foreground">Connected</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Start new chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenProfile}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Profile & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Status Bar */}
      {user && (
        <div
          onClick={onOpenProfile}
          className="mx-3 mt-3 p-2.5 rounded-xl bg-card border shadow-sm flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors"
        >
          <Avatar src={user.avatarUrl} name={user.name} isOnline={true} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <span className="text-[10px] text-muted-foreground">@{user.username}</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{user.status || 'Active now'}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-3 py-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 divide-y-0">
        {isLoadingConversations ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading chats...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary/60 mx-auto flex items-center justify-center text-muted-foreground/50 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-foreground">No conversations yet</p>
            <p className="text-[11px] mt-1 text-muted-foreground">
              Click the <span className="font-semibold text-primary">+</span> icon above to start chatting with anyone!
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = conv.type === 'GROUP';
            const otherMember = isGroup ? null : conv.members.find((m) => m.userId !== user?.id);
            const title = isGroup ? conv.name : otherMember?.user.name || 'Chat';
            const avatarSrc = isGroup ? conv.avatarUrl : otherMember?.user.avatarUrl;
            const isOnline = isGroup ? false : onlineUserIds.has(otherMember?.userId || '');
            const isActive = activeConversationId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-secondary/70 text-foreground'
                }`}
              >
                <Avatar
                  src={avatarSrc}
                  name={title || 'Chat'}
                  isOnline={isGroup ? undefined : isOnline}
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {title}
                    </p>
                    {conv.lastMessage && (
                      <span
                        className={`text-[10px] flex-shrink-0 ${
                          isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}
                      >
                        {formatRelativeDate(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-[11px] truncate ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {conv.lastMessage
                        ? conv.lastMessage.deletedAt
                          ? 'Message deleted'
                          : conv.lastMessage.content || (conv.lastMessage.attachments?.length ? '📎 Attachment' : '')
                        : isGroup
                        ? `${conv.members.length} members`
                        : 'Tap to chat'}
                    </p>

                    {conv.unreadCount > 0 && !isActive && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground min-w-4 text-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
