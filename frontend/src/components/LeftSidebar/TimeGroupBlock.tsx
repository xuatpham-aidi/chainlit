/**
 * One date-time group block (e.g. "Today", "Yesterday") in the thread list.
 * Renders a collapsible folder row and an expandable list of thread items.
 * Used by both Recent and Grouped (per-topic) sections.
 */

import { cn } from '@/lib/utils';

import { SidebarGroup, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar';

import {
  SIDEBAR_GROUP_BLOCK_PADDING,
  SIDEBAR_GROUP_BLOCK_PX,
  SIDEBAR_GROUP_BLOCK_SELECTED,
  SIDEBAR_LEVEL_1_PL,
  SIDEBAR_TIME_GROUP_ROW_STICKY,
  SIDEBAR_TIME_GROUP_ROW_WRAPPER,
  SIDEBAR_TIME_GROUP_ROW,
  SIDEBAR_TOPIC_TO_CHILDREN_GAP,
  SIDEBAR_FOLDER_CHILDREN_PL,
  SIDEBAR_TREE_CONNECTOR,
  SIDEBAR_LIST_GAP_BG,
  SIDEBAR_STICKY_TOP_SCROLL_CONTAINER
} from './layout';
import { CollapsibleGroupRow } from './CollapsibleGroupRow';

export interface TimeGroupBlockProps {
  /** Time group key (e.g. "Today", "Yesterday"). */
  groupKey: string;
  /** Label to show in the header (translated). */
  label: React.ReactNode;
  /** Number of threads in this group. */
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
  groupContainsSelected: boolean;
  stickyTopOffset?: string;
  /** When true, first group has no top padding and header uses level-1 indent. */
  compactFirstGroup?: boolean;
  /** When true, children use folder-tree indent and tree connector. */
  folderTreeStyle?: boolean;
  /** When true, this block is the first in the list (used with compactFirstGroup). */
  isFirst?: boolean;
  children: React.ReactNode;
}

export function TimeGroupBlock({
  groupKey,
  label,
  count,
  isCollapsed,
  onToggle,
  groupContainsSelected,
  stickyTopOffset = SIDEBAR_STICKY_TOP_SCROLL_CONTAINER,
  compactFirstGroup = false,
  folderTreeStyle = false,
  isFirst = false,
  children
}: TimeGroupBlockProps) {
  return (
    <SidebarGroup
      className={cn(
        SIDEBAR_GROUP_BLOCK_PADDING,
        SIDEBAR_GROUP_BLOCK_PX,
        isFirst && compactFirstGroup && 'pt-0',
        groupContainsSelected && SIDEBAR_GROUP_BLOCK_SELECTED
      )}
    >
      <div
        className={cn(
          SIDEBAR_TIME_GROUP_ROW_STICKY,
          SIDEBAR_TIME_GROUP_ROW_WRAPPER,
          stickyTopOffset
        )}
      >
        <CollapsibleGroupRow
          label={label}
          count={count}
          isCollapsed={isCollapsed}
          onToggle={onToggle}
          containsSelected={groupContainsSelected}
          className={cn(
            !groupContainsSelected && SIDEBAR_TIME_GROUP_ROW,
            compactFirstGroup && SIDEBAR_LEVEL_1_PL
          )}
        />
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
        )}
        aria-hidden={isCollapsed}
      >
        <div
          className={cn(
            'min-h-0 min-w-0 overflow-clip',
            folderTreeStyle && 'rounded-xl relative',
            folderTreeStyle && SIDEBAR_TOPIC_TO_CHILDREN_GAP,
            folderTreeStyle && SIDEBAR_FOLDER_CHILDREN_PL,
            folderTreeStyle && SIDEBAR_TREE_CONNECTOR
          )}
        >
          <SidebarGroupContent className="min-h-0 overflow-hidden px-0">
            <SidebarMenu
              key={`${groupKey}-${isCollapsed}`}
              className={cn('gap-1', SIDEBAR_LIST_GAP_BG)}
            >
              {children}
            </SidebarMenu>
          </SidebarGroupContent>
        </div>
      </div>
    </SidebarGroup>
  );
}
