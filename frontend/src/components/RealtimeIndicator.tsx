"use client";

import { useRealtimeState } from '@/providers/RealtimeProvider';
import { memo } from 'react';

export const RealtimeIndicator = memo(function RealtimeIndicator({ 
  className = '',
  showLabel = true,
  size = 'md',
}: { className?: string; showLabel?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const state = useRealtimeState();

  const sizeClasses = {
    sm: 'w-1.5 h-1.5 text-xs px-2 py-0.5',
    md: 'w-2 h-2 text-xs px-2.5 py-0.5',
    lg: 'w-2.5 h-2.5 text-sm px-3 py-1',
  };

  const statusConfig = {
    connecting: { color: 'yellow', label: 'Connecting...', pulse: true },
    connected: { color: 'green', label: 'Live', pulse: true },
    disconnected: { color: 'gray', label: 'Disconnected', pulse: false },
    reconnecting: { color: 'yellow', label: 'Reconnecting...', pulse: true },
    failed: { color: 'red', label: 'Connection failed', pulse: false },
  };

  const config = statusConfig[state.status];
  const dotClass = `rounded-full ${config.pulse ? 'animate-pulse' : ''} ${
    config.color === 'green' ? 'bg-green-500' :
    config.color === 'yellow' ? 'bg-yellow-500' :
    config.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
  }`;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={dotClass} aria-hidden="true" />
      {showLabel && (
        <span className={`font-medium ${sizeClasses[size]} text-white/80`}>
          {config.label}
        </span>
      )}
    </div>
  );
});

RealtimeIndicator.displayName = 'RealtimeIndicator';

export const ConnectionStatus = memo(function ConnectionStatus({ 
  className = '',
}: { className?: string }) {
  const state = useRealtimeState();

  const statusDetails = {
    connecting: { 
      icon: '🔄', 
      text: 'Connecting to real-time server...', 
      color: 'text-yellow-400' 
    },
    connected: { 
      icon: '🟢', 
      text: `Connected ${state.lastConnected ? `· Last: ${formatRelative(state.lastConnected)}` : ''}`, 
      color: 'text-green-400' 
    },
    disconnected: { 
      icon: '⚪', 
      text: 'Disconnected from real-time server', 
      color: 'text-gray-500' 
    },
    reconnecting: { 
      icon: '🔄', 
      text: `Reconnecting... (attempt ${state.reconnectAttempts})`, 
      color: 'text-yellow-400' 
    },
    failed: { 
      icon: '🔴', 
      text: 'Connection failed. Please refresh the page.', 
      color: 'text-red-400' 
    },
  };

  const detail = statusDetails[state.status];

  return (
    <div className={`flex items-center gap-2 p-3 bg-[#1e293b]/50 rounded-xl border border-[#334155] ${className}`}>
      <span className="text-xl">{detail.icon}</span>
      <span className={`${detail.color} font-medium text-sm`}>{detail.text}</span>
    </div>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}