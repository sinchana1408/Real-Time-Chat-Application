import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Reply,
  Trash2,
  Edit2,
  Check,
  CheckCheck,
  X,
  FileText,
  Download,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Avatar } from '../common/Avatar.js';
import { useChatStore } from '../../store/useChatStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { formatTime } from '../../lib/utils.js';
import { apiRequest } from '../../lib/api.js';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '🎉', '👏'];

export const ChatArea: React.FC = () => {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    isLoadingMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    replyingTo,
    setReplyingTo,
    sendTypingStatus,
    typingUsers,
    onlineUserIds,
    selectConversation,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const isGroup = activeConversation?.type === 'GROUP';
  const otherMember = isGroup ? null : activeConversation?.members.find((m) => m.userId !== user?.id);
  const chatTitle = isGroup ? activeConversation?.name : otherMember?.user.name;
  const isOnline = isGroup ? false : onlineUserIds.has(otherMember?.userId || '');

  // Typing state for active conversation
  const activeTyping = (activeConversationId ? typingUsers[activeConversationId] : []) || [];
  const otherTyping = activeTyping.filter((t) => t.userId !== user?.id);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-chat-panel text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95a1 1 0 0 0 1.258 1.258l4.782-1.388A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-foreground">Select a Conversation</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Choose a conversation from the sidebar or start a new chat to begin messaging in real time.
        </p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Send typing status
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');
    sendTypingStatus(false);
    await sendMessage(content);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiRequest<any>('/messages/upload/file', {
        method: 'POST',
        body: formData,
      });

      const isImg = file.type.startsWith('image/');
      await sendMessage(isImg ? 'Photo' : file.name, isImg ? 'IMAGE' : 'FILE', [res]);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartEdit = (msg: any) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    await editMessage(msgId, editText.trim());
    setEditingMessageId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-chat-panel min-w-0">
      {/* Chat Header */}
      <div className="h-16 px-4 border-b flex items-center justify-between bg-card/60 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => selectConversation(null)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Avatar
            src={isGroup ? activeConversation.avatarUrl : otherMember?.user.avatarUrl}
            name={chatTitle || 'Chat'}
            isOnline={isGroup ? undefined : isOnline}
            size="md"
          />

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">{chatTitle}</h2>
            <p className="text-[11px] text-muted-foreground truncate">
              {otherTyping.length > 0 ? (
                <span className="text-primary font-medium flex items-center gap-1 animate-pulse">
                  {otherTyping.map((t) => t.name).join(', ')} is typing...
                </span>
              ) : isGroup ? (
                `${activeConversation.members.length} members`
              ) : isOnline ? (
                <span className="text-emerald-500 font-medium">Online</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => alert(`Conversation ID: ${activeConversation.id}`)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages List Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" /> Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center mb-2">
              <Smile className="w-6 h-6 text-primary/70" />
            </div>
            <p className="text-xs font-semibold text-foreground">Say hello to {chatTitle}!</p>
            <p className="text-[11px] mt-0.5">Send a message to break the ice.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isSystem = msg.type === 'SYSTEM';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-secondary text-muted-foreground font-medium">
                    {msg.sender.name} {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Avatar
                    src={msg.sender.avatarUrl}
                    name={msg.sender.name}
                    size="sm"
                    className="mt-1"
                  />
                )}

                <div className={`flex flex-col max-w-[78%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name in Group */}
                  {isGroup && !isMe && (
                    <span className="text-[10px] text-muted-foreground font-semibold mb-1 ml-1">
                      {msg.sender.name}
                    </span>
                  )}

                  {/* Reply Quote Block */}
                  {msg.replyTo && (
                    <div
                      className={`text-[11px] px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2 border-primary bg-secondary/60 text-muted-foreground truncate max-w-full ${
                        isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
                      }`}
                    >
                      <span className="font-semibold text-foreground mr-1">
                        {msg.replyTo.sender.name}:
                      </span>
                      {msg.replyTo.content}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className="relative group/bubble">
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-card border text-card-foreground rounded-tl-sm'
                      }`}
                    >
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-1.5">
                          {msg.attachments.map((att) => (
                            <div key={att.id} className="rounded-xl overflow-hidden">
                              {att.mimeType.startsWith('image/') ? (
                                <img
                                  src={att.url}
                                  alt={att.filename}
                                  className="max-h-60 rounded-lg object-cover w-full cursor-pointer hover:opacity-95"
                                  onClick={() => window.open(att.url, '_blank')}
                                />
                              ) : (
                                <a
                                  href={att.url}
                                  download={att.filename}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 text-current text-[11px]"
                                >
                                  <FileText className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate flex-1 font-medium">{att.filename}</span>
                                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content / Edit mode */}
                      {editingMessageId === msg.id ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 text-xs text-foreground bg-background rounded border"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-2 py-0.5 text-[10px] rounded bg-secondary text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(msg.id)}
                              className="px-2 py-0.5 text-[10px] rounded bg-primary text-primary-foreground font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      {/* Timestamp & Status */}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isMe ? 'text-primary-foreground/75' : 'text-muted-foreground'
                        }`}
                      >
                        {msg.editedAt && <span>(edited)</span>}
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>

                    {/* Hover Reaction & Actions Trigger */}
                    <div
                      className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity bg-card border rounded-full shadow-lg p-0.5 flex items-center gap-0.5 z-20 ${
                        isMe ? 'right-0 -translate-x-2' : 'left-0 translate-x-2'
                      }`}
                    >
                      {QUICK_EMOJIS.slice(0, 3).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className="hover:scale-125 transition-transform px-1 text-xs"
                        >
                          {emoji}
                        </button>
                      ))}

                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-full"
                        title="Reply"
                      >
                        <Reply className="w-3 h-3" />
                      </button>

                      {isMe && !msg.deletedAt && (
                        <>
                          <button
                            onClick={() => handleStartEdit(msg)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded-full"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded-full"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reaction Pills below message */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(
                        msg.reactions.reduce((acc, r) => {
                          acc.set(r.emoji, (acc.get(r.emoji) || 0) + 1);
                          return acc;
                        }, new Map<string, number>())
                      ).map(([emoji, count]) => {
                        const hasReacted = msg.reactions.some(
                          (r) => r.userId === user?.id && r.emoji === emoji
                        );
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all ${
                              hasReacted
                                ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                                : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-secondary/80 border-t flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Replying to</span>
            <span className="font-semibold text-foreground">{replyingTo.sender.name}:</span>
            <span className="truncate text-muted-foreground">{replyingTo.content}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Composer */}
      <form onSubmit={handleSend} className="p-3 border-t bg-card/60 backdrop-blur-sm flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Attach file or photo"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Paperclip className="w-5 h-5" />}
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 text-xs sm:text-sm bg-secondary/60 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all shadow-sm"
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
