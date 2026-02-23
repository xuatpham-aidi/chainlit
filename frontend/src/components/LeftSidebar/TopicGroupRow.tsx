/**
 * A single topic/folder row in Grouped chat (Topics).
 * Sortable (drag to reorder), expand/collapse, dropdown menu (rename, delete).
 */

import { useCallback } from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SidebarGroup } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import {
  SIDEBAR_GROUP_BLOCK_PX,
  SIDEBAR_GROUP_BLOCK_SELECTED,
  SIDEBAR_GROUP_ROW_STICKY,
  SIDEBAR_GROUP_ROW_SELECTED_TINT,
  SIDEBAR_TOPIC_ROW_STICKY_TOP,
  SIDEBAR_ROW_HOVER_BG,
  SIDEBAR_TIME_GROUP_ROW,
  SIDEBAR_ICON_BUTTON,
  SIDEBAR_MENU_ITEM
} from './layout';
import { Translator } from '../i18n';
import { CollapsibleGroupRow } from './CollapsibleGroupRow';
import type { ThreadGroupRecord } from './types';

const SECTION_HEADER_Z = 20;
const GROUP_ROW_Z_BASE = 10;

function getGroupRowStickyZIndex(index: number, totalCount: number): number {
  if (totalCount <= 0) return GROUP_ROW_Z_BASE;
  return Math.min(
    SECTION_HEADER_Z - 1,
    GROUP_ROW_Z_BASE + (totalCount - 1 - index)
  );
}

export interface TopicGroupRowProps {
  group: ThreadGroupRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  children: React.ReactNode;
  hasChildren?: boolean;
  isDropTarget?: boolean;
  lastDraggedGroupIdRef?: React.MutableRefObject<string | null>;
  containsSelectedThread?: boolean;
  groupIndex?: number;
  totalGroupCount?: number;
}

export function TopicGroupRow({
  group,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  children,
  hasChildren = true,
  isDropTarget = false,
  lastDraggedGroupIdRef,
  containsSelectedThread = false,
  groupIndex = 0,
  totalGroupCount = 1
}: TopicGroupRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: group.id });
  const stickyZ = getGroupRowStickyZIndex(groupIndex, totalGroupCount);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  const stickyRowStyle = { zIndex: stickyZ };

  const handleToggleClick = useCallback(() => {
    if (!hasChildren) return;
    if (lastDraggedGroupIdRef?.current === group.id) {
      lastDraggedGroupIdRef.current = null;
      return;
    }
    onToggle();
  }, [group.id, hasChildren, lastDraggedGroupIdRef, onToggle]);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!hasChildren) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggleClick();
      }
    },
    [hasChildren, handleToggleClick]
  );

  return (
    <SidebarGroup className="px-0 py-0 group/row min-w-0">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'min-w-0',
          SIDEBAR_GROUP_BLOCK_PX,
          isDragging && 'z-30',
          containsSelectedThread && SIDEBAR_GROUP_BLOCK_SELECTED
        )}
      >
        <div
          {...listeners}
          {...attributes}
          role={hasChildren ? 'button' : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleClick();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            if (e.button === 0) e.preventDefault();
          }}
          onKeyDown={handleRowKeyDown}
          style={stickyRowStyle}
          className={cn(
            'flex items-center gap-0 w-full rounded-lg overflow-hidden pr-2 select-none touch-none',
            SIDEBAR_TOPIC_ROW_STICKY_TOP,
            'sticky',
            SIDEBAR_GROUP_ROW_STICKY,
            hasChildren
              ? 'cursor-grab active:cursor-grabbing'
              : 'cursor-default',
            'transition-all duration-200 ease-out',
            'border border-transparent',
            isDragging && 'opacity-50 shadow-lg shadow-sidebar-foreground/[0.08]',
            isDropTarget &&
            'ring-2 ring-[hsl(var(--sidebar-teal)_/_0.4)] ring-inset border-[hsl(var(--sidebar-teal)_/_0.3)]',
            'bg-sidebar'
          )}
          aria-label={hasChildren ? 'Drag to reorder group' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          <div
            className={cn(
              'flex flex-1 min-w-0 min-h-0 items-center rounded-lg self-stretch',
              !containsSelectedThread && SIDEBAR_ROW_HOVER_BG,
              containsSelectedThread && SIDEBAR_GROUP_ROW_SELECTED_TINT,
              containsSelectedThread && 'rounded-r-lg -mr-2 pr-2'
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-1 min-w-0 min-h-0">
                  <CollapsibleGroupRow
                    label={<span className="truncate block">{group.name}</span>}
                    isCollapsed={!isExpanded}
                    containsSelected={containsSelectedThread}
                    contentOnly
                    showChevron={hasChildren}
                    className={cn(
                      SIDEBAR_TIME_GROUP_ROW,
                      containsSelectedThread && 'text-sidebar-foreground'
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" sideOffset={40}>
                <p className="max-w-xs break-words">{group.name}</p>
              </TooltipContent>
            </Tooltip>
            <div
              className="flex items-center shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(SIDEBAR_ICON_BUTTON, 'h-7 w-7')}
                    aria-label="Group options"
                  >
                    <Ellipsis className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="min-w-[8.5rem] rounded-xl border-sidebar-border/30 shadow-lg shadow-sidebar-foreground/[0.04] bg-sidebar dark:bg-sidebar py-1"
                  side="right"
                  align="start"
                  forceMount
                  sideOffset={20}
                >
                  <DropdownMenuItem className={SIDEBAR_MENU_ITEM} onClick={onRename}>
                    <Translator path="threadHistory.thread.menu.rename" />
                    <Pencil className="ml-auto h-3.5 w-3.5 opacity-50" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(SIDEBAR_MENU_ITEM, 'text-red-600 focus:text-red-600 dark:text-red-400')}
                    onClick={onDelete}
                  >
                    <Translator path="threadHistory.thread.menu.delete" />
                    <Trash2 className="ml-auto h-3.5 w-3.5 opacity-70" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        {!isDragging && children}
      </div>
    </SidebarGroup>
  );
}

export interface DragStateSyncProps {
  setActiveId: (id: string | null) => void;
  setOverId: (id: string | null) => void;
}

export function DragStateSync({ setActiveId, setOverId }: DragStateSyncProps) {
  const clearDragState = useCallback(() => {
    setActiveId(null);
    setOverId(null);
  }, [setActiveId, setOverId]);

  useDndMonitor({
    onDragStart: (e) => setActiveId(String(e.active.id)),
    onDragOver: (e) => setOverId(e.over ? String(e.over.id) : null),
    onDragEnd: clearDragState,
    onDragCancel: clearDragState
  });
  return null;
}
