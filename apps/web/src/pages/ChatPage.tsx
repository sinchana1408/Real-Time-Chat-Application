import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/chat/Sidebar.js';
import { ChatArea } from '../components/chat/ChatArea.js';
import { NewChatModal } from '../components/modals/NewChatModal.js';
import { ProfileModal } from '../components/modals/ProfileModal.js';
import { useChatStore } from '../store/useChatStore.js';
import { useAuthStore } from '../store/useAuthStore.js';

interface ChatPageProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ isDark, toggleTheme }) => {
  const { user } = useAuthStore();
  const {
    fetchConversations,
    initSocketListeners,
    activeConversationId,
  } = useChatStore();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
    if (user) {
      const cleanup = initSocketListeners(user.id, user.name);
      return cleanup;
    }
  }, [user]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar: Always visible on desktop, hidden on mobile if a conversation is open */}
      <div
        className={`h-full ${
          activeConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <Sidebar
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      </div>

      {/* Chat Area: Visible on desktop, on mobile only if a conversation is active */}
      <div
        className={`h-full flex-1 ${
          activeConversationId ? 'flex' : 'hidden md:flex'
        }`}
      >
        <ChatArea />
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
    </div>
  );
};
