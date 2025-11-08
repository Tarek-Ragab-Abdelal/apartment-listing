'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

/**
 * Enhanced Tooltip component with improved styling and animations
 */
export const EnhancedTooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  className,
  contentClassName,
  disabled = false,
}) => {
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild className={cn(className)}>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            className={cn(
              'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              'shadow-lg border border-border/50',
              contentClassName
            )}
            sideOffset={5}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-primary" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

/**
 * Info tooltip with info icon
 */
export const InfoTooltip: React.FC<{
  content: React.ReactNode;
  className?: string;
  iconSize?: number;
}> = ({ content, className, iconSize = 14 }) => {
  return (
    <EnhancedTooltip content={content} side="top">
      <div className={cn('inline-flex items-center justify-center cursor-help', className)}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3" />
          <path d="M12,17h.01" />
        </svg>
      </div>
    </EnhancedTooltip>
  );
};

/**
 * Help tooltip with question mark icon
 */
export const HelpTooltip: React.FC<{
  content: React.ReactNode;
  className?: string;
  iconSize?: number;
}> = ({ content, className, iconSize = 14 }) => {
  return (
    <EnhancedTooltip content={content} side="top">
      <div className={cn('inline-flex items-center justify-center cursor-help', className)}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="0.01" />
        </svg>
      </div>
    </EnhancedTooltip>
  );
};

/**
 * Wrapper component that provides tooltip context
 */
export const TooltipProvider = TooltipPrimitive.Provider;

export { EnhancedTooltip as Tooltip };