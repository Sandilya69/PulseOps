"use client";

import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = memo(function Skeleton({
  className = '',
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  animation = 'pulse',
}: SkeletonProps) {
  const formatValue = (value: string | number, defaultUnit = 'px'): string => {
    if (typeof value === 'number') return `${value}${defaultUnit}`;
    return value;
  };

  const baseStyles: React.CSSProperties = {
    width: formatValue(width),
    height: formatValue(height),
    borderRadius: formatValue(borderRadius),
    background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
    backgroundSize: '200% 100%',
    animation: animation === 'pulse' ? 'pulse 1.5s ease-in-out infinite' : 
               animation === 'wave' ? 'wave 1.5s ease-in-out infinite' : 'none',
  };

  return <div className={className} style={baseStyles} />;
});

Skeleton.displayName = 'Skeleton';

export const SkeletonText = memo(function SkeletonText({ 
  lines = 3, 
  className = '',
  width = '100%',
}: { lines?: number; className?: string; width?: string | number }) {
  return (
    <div className={className} style={{ width }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={i === lines - 1 ? '60%' : '100%'}
          width={width}
          className="mb-2"
          borderRadius="4px"
        />
      ))}
    </div>
  );
});

SkeletonText.displayName = 'SkeletonText';

export const SkeletonCard = memo(function SkeletonCard({ 
  className = '',
  showHeader = true,
  showContent = true,
  contentLines = 4,
}: { className?: string; showHeader?: boolean; showContent?: boolean; contentLines?: number }) {
  return (
    <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <Skeleton width={40} height={40} borderRadius="50%" />
          <div className="flex-1">
            <Skeleton width="40%" height={20} borderRadius="4px" />
            <Skeleton width="30%" height={14} className="mt-2" borderRadius="4px" />
          </div>
        </div>
      )}
      {showContent && (
        <SkeletonText lines={contentLines} />
      )}
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonTable = memo(function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className = '',
}: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] overflow-hidden ${className}`}>
      <div className="flex border-b border-[#334155] bg-[#0c0f1d]/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="100%" height={40} borderRadius={0} className="px-6" animation="wave" />
        ))}
      </div>
      <div className="divide-y divide-[#334155]/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex" style={{ minHeight: 48 }}>
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} width="100%" height="100%" borderRadius={0} className="px-6 h-full" animation="wave" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

SkeletonTable.displayName = 'SkeletonTable';

export const SkeletonChart = memo(function SkeletonChart({ 
  className = '',
  height = 300,
}: { className?: string; height?: number }) {
  return (
    <div className={`bg-[#1e293b]/50 rounded-2xl border border-[#334155] ${className}`} style={{ height }}>
      <div className="p-6 border-b border-[#334155]">
        <Skeleton width="30%" height={24} borderRadius="4px" />
        <Skeleton width="20%" height={14} className="mt-2" borderRadius="4px" />
      </div>
      <div className="p-6 h-[calc(100%-60px)] flex items-end justify-around">
        {Array.from({ length: 12 }).map((_, i) => {
          const height = `${(i * 7 + 13) % 60 + 20}%`;
          return (
            <Skeleton
              key={i}
              width={20}
              height={height}
              borderRadius="4px 4px 0 0"
              className="mx-1"
              animation="wave"
            />
          );
        })}
      </div>
    </div>
  );
});

SkeletonChart.displayName = 'SkeletonChart';

export const SkeletonMetricCard = memo(function SkeletonMetricCard({ 
  className = '',
}: { className?: string }) {
  return (
    <div className={`bg-[#1e293b]/50 rounded-2xl p-5 border border-[#334155] ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <Skeleton width="60%" height={12} borderRadius="4px" className="mb-2" />
          <Skeleton width="40%" height={32} borderRadius="4px" />
        </div>
        <Skeleton width={48} height={48} borderRadius="xl" />
      </div>
    </div>
  );
});

SkeletonMetricCard.displayName = 'SkeletonMetricCard';

export const SkeletonList = memo(function SkeletonList({ 
  items = 5, 
  className = '',
}: { items?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-[#1e293b]/50 rounded-xl border border-[#334155] p-4">
          <div className="flex items-center gap-4">
            <Skeleton width={40} height={40} borderRadius="50%" />
            <div className="flex-1 space-y-2">
              <Skeleton width="40%" height={16} borderRadius="4px" />
              <Skeleton width="60%" height={12} borderRadius="4px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

SkeletonList.displayName = 'SkeletonList';

export const SkeletonAvatar = memo(function SkeletonAvatar({ 
  size = 40,
  className = '',
}: { size?: number; className?: string }) {
  return (
    <Skeleton 
      width={size} 
      height={size} 
      borderRadius="50%" 
      className={className}
      animation="wave"
    />
  );
});

SkeletonAvatar.displayName = 'SkeletonAvatar';

export const SkeletonBadge = memo(function SkeletonBadge({ 
  className = '',
}: { className?: string }) {
  return (
    <Skeleton 
      width={80} 
      height={24} 
      borderRadius="9999px" 
      className={className}
      animation="wave"
    />
  );
});

SkeletonBadge.displayName = 'SkeletonBadge';