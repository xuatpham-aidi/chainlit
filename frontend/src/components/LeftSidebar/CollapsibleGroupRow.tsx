import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';

import {
  SIDEBAR_GROUP_ROW,
  SIDEBAR_GROUP_ROW_BG,
  SIDEBAR_GROUP_ROW_SELECTED,
  SIDEBAR_GROUP_ICON_SIZE
} from './layout';

export interface CollapsibleGroupRowProps {
  label: React.ReactNode;
  count?: number;
  isCollapsed: boolean;
  onToggle?: () => void;
  containsSelected?: boolean;
  className?: string;
  asButton?: boolean;
  contentOnly?: boolean;
  /** When false, show folder icon instead of chevron (e.g. empty group with no threads). */
  showChevron?: boolean;
}

/**
 * Shared row for collapsible groups: chevron, label, optional count.
 * Same behaviour and a11y for time groups (ThreadList) and topic groups (GroupedChatSection).
 */
export function CollapsibleGroupRow({
  label,
  count,
  isCollapsed,
  onToggle,
  containsSelected = false,
  className,
  asButton = true,
  contentOnly = false,
  showChevron = true
}: CollapsibleGroupRowProps) {
  const leadingIcon = showChevron ? (
    isCollapsed ? (
      <ChevronRight className={cn(SIDEBAR_GROUP_ICON_SIZE, 'shrink-0')} aria-hidden />
    ) : (
      <ChevronDown className={cn(SIDEBAR_GROUP_ICON_SIZE, 'shrink-0')} aria-hidden />
    )
  ) : (
    <Folder
      className={cn(SIDEBAR_GROUP_ICON_SIZE, 'shrink-0 text-sidebar-foreground/50')}
      aria-hidden
    />
  );
  const content = (
    <>
      {leadingIcon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'text-[11px] font-medium tabular-nums rounded-md px-1.5 py-0.5',
            containsSelected
              ? 'bg-sidebar-foreground/10 text-sidebar-foreground/80'
              : 'text-sidebar-foreground/45 bg-sidebar-foreground/[0.06]'
          )}
        >
          {count}
        </span>
      )}
    </>
  );

  const rowClassName = cn(
    SIDEBAR_GROUP_ROW,
    !contentOnly && SIDEBAR_GROUP_ROW_BG,
    'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
    !contentOnly && containsSelected && SIDEBAR_GROUP_ROW_SELECTED,
    !contentOnly && !containsSelected && 'hover:text-sidebar-foreground/90',
    className
  );

  if (contentOnly) {
    return (
      <div
        className={cn(
          'flex flex-1 min-w-0 items-center gap-2 text-left rounded-none pointer-events-none select-none text-sidebar-foreground/80',
          SIDEBAR_GROUP_ROW,
          className
        )}
      >
        {content}
      </div>
    );
  }

  if (asButton) {
    return (
      <button
        type="button"
        onClick={onToggle!}
        className={rowClassName}
        aria-expanded={!isCollapsed}
        data-active={containsSelected || undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle!}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle!();
        }
      }}
      className={rowClassName}
      aria-expanded={!isCollapsed}
      data-active={containsSelected || undefined}
    >
      {content}
    </div>
  );
}
