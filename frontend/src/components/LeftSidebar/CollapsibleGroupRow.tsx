import { cn } from '@/lib/utils';
import { ChevronRight, Folder, FolderOpen, Info } from 'lucide-react';

import {
  SIDEBAR_GROUP_ROW,
  SIDEBAR_GROUP_ROW_DEFAULT,
  SIDEBAR_GROUP_ROW_BG,
  SIDEBAR_GROUP_ROW_HOVER_TEXT,
  SIDEBAR_GROUP_ROW_SELECTED,
  SIDEBAR_GROUP_ICON_SIZE,
  SIDEBAR_GROUP_COUNT_BADGE,
  SIDEBAR_GROUP_COUNT_BADGE_DEFAULT,
  SIDEBAR_GROUP_COUNT_BADGE_SELECTED,
  SIDEBAR_FOCUS_RING,
  SIDEBAR_FOLDER_ICON_COLLAPSED,
  SIDEBAR_FOLDER_ICON_EXPANDED
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
  /** 'folder' = Folder/FolderOpen (folder-tree); 'chevron' = ChevronRight/ChevronDown. */
  iconVariant?: 'folder' | 'chevron';
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
  showChevron = true,
  iconVariant = 'folder'
}: CollapsibleGroupRowProps) {
  const leadingIcon = showChevron ? (
    iconVariant === 'folder' ? (
      isCollapsed ? (
        <Folder className={cn(SIDEBAR_GROUP_ICON_SIZE, 'shrink-0', SIDEBAR_FOLDER_ICON_COLLAPSED, 'group-hover/folder-row:text-sidebar-foreground/70')} aria-hidden />
      ) : (
        <FolderOpen className={cn(SIDEBAR_GROUP_ICON_SIZE, 'shrink-0', SIDEBAR_FOLDER_ICON_EXPANDED)} aria-hidden />
      )
    ) : (
      <ChevronRight
        className={cn(SIDEBAR_GROUP_ICON_SIZE, 'shrink-0 sidebar-chevron-rotate')}
        data-expanded={!isCollapsed}
        aria-hidden
      />
    )
  ) : (
    <Info
      className={cn(SIDEBAR_GROUP_ICON_SIZE, 'shrink-0 text-sidebar-foreground/45')}
      aria-hidden
    />
  );
  const content = (
    <>
      {leadingIcon}
      <span className="flex-1 min-w-0 overflow-hidden text-left tracking-[0.01em] truncate">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            SIDEBAR_GROUP_COUNT_BADGE,
            containsSelected
              ? SIDEBAR_GROUP_COUNT_BADGE_SELECTED
              : SIDEBAR_GROUP_COUNT_BADGE_DEFAULT
          )}
        >
          {count}
        </span>
      )}
    </>
  );

  const rowClassName = cn(
    'group/folder-row',
    SIDEBAR_GROUP_ROW,
    SIDEBAR_GROUP_ROW_DEFAULT,
    !contentOnly && SIDEBAR_GROUP_ROW_BG,
    SIDEBAR_FOCUS_RING,
    !contentOnly && containsSelected && SIDEBAR_GROUP_ROW_SELECTED,
    !contentOnly && !containsSelected && SIDEBAR_GROUP_ROW_HOVER_TEXT,
    className
  );

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) e.preventDefault();
  };

  if (contentOnly) {
    return (
      <div
        className={cn(
          'group/folder-row flex flex-1 min-w-0 items-center gap-1.5 text-left pointer-events-none select-none',
          SIDEBAR_GROUP_ROW,
          SIDEBAR_GROUP_ROW_DEFAULT,
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
        onClick={handleToggle}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
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
      onClick={handleToggle}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={handleMouseDown}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle?.();
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
