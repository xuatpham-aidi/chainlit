import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDndMonitor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
  Ellipsis,
  FolderPlus,
  Pencil,
  Trash2
} from 'lucide-react';
import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  ClientError,
  groupByDate,
  threadGroupsState,
  threadHistoryState,
  useConfig
} from '@chainlit/react-client';

import { sidebarGroupTimeGroupCollapsedState } from '@/state/sidebar';
import { threadListLoadingState } from '@/state/project';
import { Loader } from '@/components/Loader';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

import {
  SIDEBAR_GROUP_ROW_STICKY,
  SIDEBAR_GROUP_ROW_SELECTED,
  SIDEBAR_GROUP_ROW_SELECTED_STICKY,
  SIDEBAR_GROUP_BLOCK_SELECTED,
  SIDEBAR_SECTION_GAP,
  SIDEBAR_SECTION_INNER_GAP,
  SIDEBAR_ACTION_BUTTON,
  SIDEBAR_ICON_BUTTON,
  SIDEBAR_MENU_ITEM,
  SIDEBAR_TOPIC_TO_CHILDREN_GAP,
  SIDEBAR_TOPIC_ROW_STICKY_TOP,
  SIDEBAR_TIME_GROUP_ROW_STICKY_TOP
} from './layout';
import { Translator } from '../i18n';
import { CollapsibleGroupRow } from './CollapsibleGroupRow';
import { SidebarSection } from './SidebarSection';
import { ThreadList } from './ThreadList';
import { getSortedTimeGroupKeys } from './ThreadList';

const DRAG_ACTIVATION_DISTANCE_PX = 6;
const CLICK_AFTER_DRAG_SUPPRESS_MS = 300;

interface IThreadGroup {
  id: string;
  userId: string;
  name: string;
  displayOrder: number;
  createdAt?: string;
}

/** Section header uses z-20; group rows use z-[10..19] so earlier groups stack on top when sticky. */
const SIDEBAR_SECTION_HEADER_Z = 20;
const SIDEBAR_GROUP_ROW_Z_BASE = 10;

function getGroupRowStickyZIndex(index: number, totalCount: number): number {
  if (totalCount <= 0) return SIDEBAR_GROUP_ROW_Z_BASE;
  return Math.min(
    SIDEBAR_SECTION_HEADER_Z - 1,
    SIDEBAR_GROUP_ROW_Z_BASE + (totalCount - 1 - index)
  );
}

interface SortableGroupRowProps {
  group: IThreadGroup;
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

/**
 * Single group row: click to expand/collapse, hold and move to drag and reorder.
 * Options menu (ellipsis) does not start drag (stopPropagation).
 */
function SortableGroupRow({
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
}: SortableGroupRowProps) {
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
              'flex items-center gap-0 w-full rounded-xl overflow-hidden touch-none pr-3 select-none',
              SIDEBAR_TOPIC_ROW_STICKY_TOP,
            'sticky',
            SIDEBAR_GROUP_ROW_STICKY,
            hasChildren
              ? 'cursor-grab active:cursor-grabbing'
              : 'cursor-default',
            'transition-colors duration-200 ease-out',
            'border border-transparent',
            containsSelectedThread && SIDEBAR_GROUP_ROW_SELECTED_STICKY,
            isDragging && 'opacity-60 shadow-md',
            isDropTarget && 'ring-2 ring-sidebar-border ring-inset border-sidebar-border/60',
            'bg-sidebar'
          )}
          aria-label={hasChildren ? 'Drag to reorder group' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
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
                  className="text-sidebar-foreground/85"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="start" sideOffset={50}>
              <p className="max-w-xs break-words">{group.name}</p>
            </TooltipContent>
          </Tooltip>
          <div
            className="flex items-center shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(SIDEBAR_ICON_BUTTON, 'h-8 w-8')}
                  aria-label="Group options"
                >
                  <Ellipsis className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-[9rem] rounded-xl border-sidebar-border/60 shadow-lg bg-sidebar dark:bg-sidebar"
                side="right"
                align="start"
                forceMount
                sideOffset={20}
              >
                <DropdownMenuItem className={SIDEBAR_MENU_ITEM} onClick={onRename}>
                  <Translator path="threadHistory.thread.menu.rename" />
                  <Pencil className="ml-auto h-4 w-4 opacity-60" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(SIDEBAR_MENU_ITEM, 'text-red-600 focus:text-red-600 dark:text-red-400')}
                  onClick={onDelete}
                >
                  <Translator path="threadHistory.thread.menu.delete" />
                  <Trash2 className="ml-auto h-4 w-4 opacity-60" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {!isDragging && children}
      </div>
    </SidebarGroup>
  );
}


interface DragStateSyncProps {
  setActiveId: (id: string | null) => void;
  setOverId: (id: string | null) => void;
}

function DragStateSync({ setActiveId, setOverId }: DragStateSyncProps) {
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

export interface GroupedChatSectionProps {
  sectionExpanded?: boolean;
  onSectionExpandedChange?: (expanded: boolean) => void;
  expandedGroups?: Set<string>;
  onExpandedGroupsChange?: (set: React.SetStateAction<Set<string>>) => void;
}

export function GroupedChatSection({
  sectionExpanded: sectionExpandedProp,
  onSectionExpandedChange,
  expandedGroups: expandedGroupsProp,
  onExpandedGroupsChange
}: GroupedChatSectionProps = {}) {
  const { t } = useTranslation();
  const { config } = useConfig();
  const dataPersistence = config?.dataPersistence;
  const apiClient = useContext(ChainlitContext);
  const threadGroupsRaw = useRecoilValue(threadGroupsState) ?? [];
  const setThreadGroups = useSetRecoilState(threadGroupsState);
  const threadHistory = useRecoilValue(threadHistoryState);
  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const lastDraggedGroupIdRef = useRef<string | null>(null);

  const [internalExpanded, setInternalExpanded] = useState(false);
  const sectionExpanded =
    sectionExpandedProp !== undefined ? sectionExpandedProp : internalExpanded;
  const setSectionExpanded =
    onSectionExpandedChange !== undefined
      ? (v: boolean) => onSectionExpandedChange(v)
      : setInternalExpanded;

  const threadGroups = useMemo(
    () =>
      [...threadGroupsRaw].sort((a, b) => {
        const orderA = a.displayOrder ?? 0;
        const orderB = b.displayOrder ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      }),
    [threadGroupsRaw]
  );

  const [internalExpandedGroups, setInternalExpandedGroups] =
    useState<Set<string>>(new Set());
  const expandedGroups =
    expandedGroupsProp !== undefined ? expandedGroupsProp : internalExpandedGroups;
  const setExpandedGroups =
    onExpandedGroupsChange !== undefined
      ? onExpandedGroupsChange
      : setInternalExpandedGroups;
  const [groupTimeGroupCollapsed, setGroupTimeGroupCollapsed] = useRecoilState(
    sidebarGroupTimeGroupCollapsedState
  );
  const listLoading = useRecoilValue(threadListLoadingState);
  const isLoading = listLoading?.isFetching || listLoading?.isLoadingMore;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null);
  const [renameGroupName, setRenameGroupName] = useState('');
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  const threadsByGroupId = useMemo(() => {
    const threads = threadHistory?.threads ?? [];
    const map: Record<string, typeof threads> = {};
    for (const g of threadGroups) {
      map[g.id] = threads.filter((t) => t.groupId === g.id);
    }
    return map;
  }, [threadHistory?.threads, threadGroups]);

  const currentThreadId = threadHistory?.currentThreadId ?? null;
  const sectionContainsSelected = useMemo(
    () =>
      Boolean(
        currentThreadId &&
        threadGroups.some((g) =>
          (threadsByGroupId[g.id] ?? []).some((t) => t.id === currentThreadId)
        )
      ),
    [currentThreadId, threadGroups, threadsByGroupId]
  );

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleCreateGroup = useCallback(() => {
    const name = newGroupName.trim();
    if (!name || !apiClient.createThreadGroup) return;
    const nameLower = name.toLowerCase();
    const isDuplicate = (threadGroupsRaw ?? []).some(
      (g) => (g.name || '').trim().toLowerCase() === nameLower
    );
    if (isDuplicate) {
      toast.error(
        t('threadHistory.sidebar.createGroup.duplicateName', 'Group name already exists')
      );
      return;
    }
    toast.promise(apiClient.createThreadGroup(name), {
      loading: <Translator path="threadHistory.sidebar.createGroup.inProgress" />,
      success: (created) => {
        const newGroupAtTop = { ...created, displayOrder: 0 };
        const shifted = (threadGroupsRaw ?? []).map((g) => ({
          ...g,
          displayOrder: (g.displayOrder ?? 0) + 1
        }));
        setThreadGroups([newGroupAtTop, ...shifted]);
        setNewGroupName('');
        setCreateDialogOpen(false);
        return <Translator path="threadHistory.sidebar.createGroup.success" />;
      },
      error: (err) => {
        if (err instanceof ClientError) {
          const msg = err.detail ?? err.message;
          return <span>{msg}</span>;
        }
        return <Translator path="threadHistory.sidebar.createGroup.error" />;
      }
    });
  }, [apiClient, newGroupName, setThreadGroups, threadGroupsRaw, t]);

  const handleRenameGroup = useCallback(async () => {
    if (!renameGroupId || !renameGroupName.trim() || !apiClient.updateThreadGroup)
      return;
    const name = renameGroupName.trim();
    const nameLower = name.toLowerCase();
    const isDuplicate = (threadGroupsRaw ?? []).some(
      (g) =>
        g.id !== renameGroupId &&
        (g.name || '').trim().toLowerCase() === nameLower
    );
    if (isDuplicate) {
      toast.error(
        t('threadHistory.sidebar.createGroup.duplicateName', 'Group name already exists')
      );
      return;
    }
    try {
      await apiClient.updateThreadGroup(renameGroupId, { name });
      setThreadGroups((prev) =>
        (prev ?? []).map((g) =>
          g.id === renameGroupId ? { ...g, name } : g
        )
      );
      setRenameGroupId(null);
      setRenameGroupName('');
    } catch (err) {
      const msg =
        err instanceof ClientError
          ? err.detail ?? err.message
          : 'Failed to rename group';
      toast.error(msg);
    }
  }, [apiClient, renameGroupId, renameGroupName, setThreadGroups, threadGroupsRaw, t]);

  const handleDeleteGroup = useCallback(() => {
    if (!deleteGroupId || !apiClient.deleteThreadGroup) return;
    const groupIdToDelete = deleteGroupId;
    toast.promise(apiClient.deleteThreadGroup(groupIdToDelete), {
      loading: <Translator path="threadHistory.sidebar.deleteGroup.inProgress" />,
      success: () => {
        setThreadGroups((prev) => (prev ?? []).filter((g) => g.id !== groupIdToDelete));
        setThreadHistory((prev) => ({
          ...prev,
          threads: prev?.threads?.filter((t) => t.groupId !== groupIdToDelete) ?? []
        }));
        setGroupTimeGroupCollapsed((prev) => {
          const next = { ...prev };
          delete next[groupIdToDelete];
          return next;
        });
        setDeleteGroupId(null);
        return <Translator path="threadHistory.sidebar.deleteGroup.success" />;
      },
      error: (err) => {
        if (err instanceof ClientError) return <span>{err.message}</span>;
        return <Translator path="threadHistory.sidebar.deleteGroup.error" />;
      }
    });
  }, [apiClient, deleteGroupId, setGroupTimeGroupCollapsed, setThreadGroups, setThreadHistory]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX }
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const activeId = String(active.id);

      lastDraggedGroupIdRef.current = activeId;
      setTimeout(() => {
        lastDraggedGroupIdRef.current = null;
      }, CLICK_AFTER_DRAG_SUPPRESS_MS);

      if (!over || active.id === over.id) return;
      const overId = String(over.id);

      const oldIndex = threadGroups.findIndex((g) => g.id === activeId);
      const newIndex = threadGroups.findIndex((g) => g.id === overId);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = arrayMove(threadGroups, oldIndex, newIndex);
      const withNewOrder = reordered.map((g, i) => ({ ...g, displayOrder: i }));
      const orderedIds = withNewOrder.map((g) => g.id);
      const previous = threadGroupsRaw;

      setThreadGroups(withNewOrder);
      try {
        await apiClient.reorderThreadGroups(orderedIds);
      } catch {
        setThreadGroups(previous);
        toast.error('Failed to reorder groups');
      }
    },
    [apiClient, threadGroups, threadGroupsRaw, setThreadGroups]
  );

  if (!dataPersistence || !apiClient.listThreadGroups) return null;

  return (
    <SidebarSection
      title={<Translator path="threadHistory.sidebar.groupedChat" />}
      expanded={sectionExpanded}
      onToggle={() => setSectionExpanded(!sectionExpanded)}
      containsSelected={sectionContainsSelected}
      isLoading={isLoading}
      ariaLabel="Grouped chat"
      stickyHeader
    >
      <div className="min-h-0 min-w-0 overflow-clip">
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
          <DragStateSync setActiveId={setDragActiveId} setOverId={setDragOverId} />
          <SortableContext
            items={threadGroups.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={cn('flex min-w-0 flex-col', SIDEBAR_SECTION_INNER_GAP)}>
              <Button
                variant="ghost"
                size="sm"
                className={SIDEBAR_ACTION_BUTTON}
                onClick={() => setCreateDialogOpen(true)}
                aria-label={t('threadHistory.sidebar.createGroupTitle')}
              >
                <FolderPlus className="size-4 shrink-0" />
                <span className="truncate">
                  <Translator path="threadHistory.sidebar.createGroupTitle" />
                </span>
              </Button>
              {threadGroups.map((group, groupIndex) => {
                const threads = threadsByGroupId[group.id] ?? [];
                const timeGrouped = groupByDate(threads);
                const sortedKeys = getSortedTimeGroupKeys(timeGrouped);
                const groupHistory = {
                  ...threadHistory,
                  threads,
                  timeGroupedThreads: timeGrouped,
                  currentThreadId: threadHistory?.currentThreadId
                };
                const isExpanded = expandedGroups.has(group.id);
                const isDropTarget =
                  dragOverId === group.id && dragActiveId !== group.id;
                const groupContainsSelected = Boolean(
                  currentThreadId &&
                  (threadsByGroupId[group.id] ?? []).some(
                    (t) => t.id === currentThreadId
                  )
                );

                return (
                  <SortableGroupRow
                    key={group.id}
                    group={group}
                    groupIndex={groupIndex}
                    totalGroupCount={threadGroups.length}
                    isExpanded={isExpanded}
                    hasChildren={threads.length > 0}
                    onToggle={() => toggleGroup(group.id)}
                    containsSelectedThread={groupContainsSelected}
                    onRename={() => {
                      setRenameGroupId(group.id);
                      setRenameGroupName(group.name);
                    }}
                    onDelete={() => setDeleteGroupId(group.id)}
                    isDropTarget={isDropTarget}
                    lastDraggedGroupIdRef={lastDraggedGroupIdRef}
                  >
                    <div
                      className={cn(
                        'grid min-w-0 transition-[grid-template-rows] duration-200 ease-out',
                        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      )}
                      aria-hidden={!isExpanded}
                    >
                      <div className={cn('min-h-0 min-w-0 overflow-clip rounded-xl', isExpanded && SIDEBAR_TOPIC_TO_CHILDREN_GAP)}>
                        <SidebarGroupContent className="min-h-0 min-w-0 overflow-clip rounded-xl px-0">
                          <SidebarMenu className="gap-1">
                            {sortedKeys.length > 0 && (
                              <ThreadList
                                threadHistory={groupHistory}
                                error={undefined}
                                isFetching={false}
                                isLoadingMore={false}
                                collapsedGroups={
                                  groupTimeGroupCollapsed[group.id] ?? null
                                }
                                setCollapsedGroups={(updater) =>
                                  setGroupTimeGroupCollapsed((prev) => ({
                                    ...prev,
                                    [group.id]:
                                      typeof updater === 'function'
                                        ? updater(prev[group.id] ?? null)
                                        : updater
                                  }))
                                }
                                stickyTopOffset={SIDEBAR_TIME_GROUP_ROW_STICKY_TOP}
                                compactFirstGroup
                              />
                            )}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </div>
                    </div>
                  </SortableGroupRow>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Translator path="threadHistory.sidebar.createGroupTitle" />
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder={t('threadHistory.sidebar.createGroupPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
            >
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!renameGroupId}
        onOpenChange={(open) => !open && setRenameGroupId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Translator path="threadHistory.thread.actions.rename.title" />
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameGroupName}
              onChange={(e) => setRenameGroupName(e.target.value)}
              placeholder={t('threadHistory.sidebar.createGroupPlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameGroupId(null)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button onClick={handleRenameGroup} disabled={!renameGroupName.trim()}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Translator path="threadHistory.sidebar.deleteGroupTitle" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Translator path="threadHistory.sidebar.deleteGroupDescription" />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Translator path="common.actions.cancel" />
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>
              <Translator path="common.actions.confirm" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarSection>
  );
}
