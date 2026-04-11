import React from 'react';

type SkeletonVariant = 'line' | 'circle' | 'rect' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'line',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const baseStyles: Record<SkeletonVariant, string> = {
    line: 'h-4 w-full rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
    card: 'rounded-2xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'circle' && !width) {
    style.width = '40px';
    style.height = '40px';
  }
  if (variant === 'card' && !height) {
    style.height = '160px';
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${baseStyles[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
};

/** Table skeleton with rows and columns */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="w-full space-y-3">
    <div className="flex gap-4 pb-2 border-b border-border-light dark:border-border-dark">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="line" height={12} width={i === 0 ? '30%' : '18%'} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="flex gap-4 py-2">
        {Array.from({ length: cols }).map((_, col) => (
          <Skeleton
            key={col}
            variant="line"
            height={14}
            width={col === 0 ? '30%' : '18%'}
          />
        ))}
      </div>
    ))}
  </div>
);

/** Card grid skeleton */
export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-card dark:glass-card glass-card-light p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" width={36} height={36} />
          <Skeleton variant="line" width="60%" height={14} />
        </div>
        <Skeleton variant="line" height={10} width="90%" />
        <Skeleton variant="line" height={10} width="70%" />
        <div className="flex gap-2 pt-2">
          <Skeleton variant="rect" width={60} height={22} />
          <Skeleton variant="rect" width={80} height={22} />
        </div>
      </div>
    ))}
  </div>
);
