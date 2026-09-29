import React from 'react';
import { cn } from '../../lib/utils.js';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const badgeSizes = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'rounded-full object-cover ring-1 ring-border/50 bg-secondary shadow-sm',
            sizeClasses[size]
          )}
          onError={(e) => {
            // fallback if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-tr from-primary/80 to-primary text-primary-foreground font-semibold flex items-center justify-center shadow-sm select-none',
            sizeClasses[size]
          )}
        >
          {initials || '?'}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-background transition-colors duration-300',
            badgeSizes[size],
            isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/40'
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
