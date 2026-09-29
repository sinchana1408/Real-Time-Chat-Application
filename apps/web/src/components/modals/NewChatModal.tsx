import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, X, Loader2, MessageSquare, Check } from 'lucide-react';
import { Avatar } from '../common/Avatar.js';
import { apiRequest } from '../../lib/api.js';
import { useChatStore } from '../../store/useChatStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const { createDirectChat, createGroupChat, onlineUserIds } = useChatStore();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setGroupName('');
      return;
    }

    // Initial search or clear
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        try {
          const users = await apiRequest<any[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(users);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        // Load initial suggestions
        setIsSearching(true);
        try {
          const users = await apiRequest<any[]>('/users/search?q=a');
          setSearchResults(users);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  const handleStartDirect = async (recipientId: string) => {
    try {
      await createDirectChat(recipientId);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation');
    }
  };

  const handleToggleGroupUser = (user: any) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    if (selectedUsers.length < 1) {
      alert('Please select at least 1 member for the group');
      return;
    }

    setIsCreatingGroup(true);
    try {
      await createGroupChat(
        groupName.trim(),
        selectedUsers.map((u) => u.id)
      );
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              {activeTab === 'direct' ? <MessageSquare className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {activeTab === 'direct' ? 'New Message' : 'Create New Group'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {activeTab === 'direct' ? 'Start a conversation with someone' : 'Bring people together into a room'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-2 bg-secondary/50 border-b gap-1">
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'direct'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Direct Chat
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'group'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Group Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          {activeTab === 'group' && (
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Group Name</label>
              <input
                type="text"
                placeholder="e.g. Project Apollo Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                autoFocus
              />
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, @username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Selected Users Chips for Group */}
        {activeTab === 'group' && selectedUsers.length > 0 && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b bg-secondary/20 max-h-24 overflow-y-auto">
            {selectedUsers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {u.name}
                <button
                  type="button"
                  onClick={() => handleToggleGroupUser(u)}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* User Search Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-border/40">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
              <p className="text-xs">Finding contacts...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs mt-1">Try searching with a different name or username</p>
            </div>
          ) : (
            searchResults.map((usr) => {
              const isSelected = selectedUsers.some((u) => u.id === usr.id);
              const isOnline = onlineUserIds.has(usr.id);

              return (
                <div
                  key={usr.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer"
                  onClick={() => {
                    if (activeTab === 'group') {
                      handleToggleGroupUser(usr);
                    } else {
                      handleStartDirect(usr.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={usr.avatarUrl}
                      name={usr.name}
                      isOnline={isOnline}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{usr.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{usr.username}</p>
                    </div>
                  </div>

                  {activeTab === 'group' ? (
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartDirect(usr.id);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Chat
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer for Group Creation */}
        {activeTab === 'group' && (
          <div className="p-4 border-t flex justify-end gap-2 bg-card">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !groupName.trim() || selectedUsers.length === 0}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {isCreatingGroup && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Group ({selectedUsers.length + 1})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
