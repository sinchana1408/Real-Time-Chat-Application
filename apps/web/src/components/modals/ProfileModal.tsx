import React, { useState } from 'react';
import { X, Moon, Sun, LogOut, Check, Loader2, Sparkles, User, Mail, AtSign } from 'lucide-react';
import { Avatar } from '../common/Avatar.js';
import { useAuthStore } from '../../store/useAuthStore.js';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  isDark,
  toggleTheme,
}) => {
  const { user, updateProfile, logout, isLoading } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState(user?.status || '');
  const [avatarSeed, setAvatarSeed] = useState(user?.username || 'user');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleRandomizeAvatar = () => {
    const random = Math.random().toString(36).substring(7);
    setAvatarSeed(random);
  };

  const currentAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        status: status.trim(),
        avatarUrl: currentAvatarUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Profile & Settings</h3>
              <p className="text-xs text-muted-foreground">Manage your identity and appearance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/40 border">
            <Avatar src={currentAvatarUrl} name={name || user.name} size="xl" />
            <div>
              <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border hover:bg-secondary text-foreground flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Generate New Avatar
              </button>
              <p className="text-[11px] text-muted-foreground mt-1">
                Generates a fresh avatar using Dicebear
              </p>
            </div>
          </div>

          {/* User ID & Email Badge */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/30 border flex items-center gap-2 min-w-0">
              <AtSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium text-foreground">@{user.username}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium text-foreground">{user.email}</span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
              required
            />
          </div>

          {/* Status Message */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Status Message</label>
            <input
              type="text"
              placeholder="e.g. 🎧 In focus mode | 🏖️ On vacation"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Bio</label>
            <textarea
              rows={2}
              placeholder="A short note about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-secondary/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground resize-none placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Appearance Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-secondary/30">
            <div className="flex items-center gap-2.5">
              {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span className="text-xs font-semibold text-foreground">Dark Theme</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDark ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border hover:bg-secondary text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : null}
                {saveSuccess ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
