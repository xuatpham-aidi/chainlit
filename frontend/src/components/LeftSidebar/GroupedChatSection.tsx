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
  ChevronDown,
  ChevronRight,
  Ellipsis,
  FolderPlus,
  Pencil,
  Trash2
} from 'lucide-react';
import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  ClientError,
  groupByDate,
  threadGroupsState,
  threadHistoryState,
  useConfig
} from '@chainlit/react-client';

import { buttonVariants } from '@/components/ui/button';
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

import { Translator } from '../i18n';
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

interface SortableGroupRowProps {
  group: IThreadGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  children: React.ReactNode;
  isDropTarget?: boolean;
  lastDraggedGroupIdRef?: React.MutableRefObject<string | null>;
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
  isDropTarget = false,
  lastDraggedGroupIdRef
}: SortableGroupRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: group.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  const handleToggleClick = useCallback(() => {
    if (lastDraggedGroupIdRef?.current === group.id) {
      lastDraggedGroupIdRef.current = null;
      return;
    }
    onToggle();
  }, [group.id, lastDraggedGroupIdRef, onToggle]);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggleClick();
      }
    },
    [handleToggleClick]
  );
  return (
    <SidebarGroup className="px-0 py-0 group/row">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(isDragging && 'z-10')}
      >
        <div
          {...listeners}
          {...attributes}
          role="button"
          tabIndex={0}
          onClick={handleToggleClick}
          onKeyDown={handleRowKeyDown}
          className={cn(
            'flex items-center gap-0 w-full rounded-lg overflow-hidden cursor-grab active:cursor-grabbing touch-none',
            'bg-neutral-300/20 hover:bg-neutral-300/50 transition-colors duration-150',
            'border border-transparent',
            isDragging && 'opacity-60 shadow-md',
            isDropTarget && 'ring-2 ring-sidebar-border ring-inset border-sidebar-border/60'
          )}
          aria-label="Drag to reorder group"
          aria-expanded={isExpanded}
        >
          <div
            className={cn(
              'flex flex-1 min-w-0 items-center gap-2 py-1.5 pl-2.5 pr-2 text-left rounded-none pointer-events-none select-none',
              'text-xs font-medium tracking-tight'
            )}
            aria-hidden
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/80" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/80" />
            )}
            <span className="flex-1 truncate">{group.name}</span>
          </div>
          <div
            className="flex items-center shrink-0 pr-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'h-7 w-7 rounded-md'
                  )}
                  aria-label="Group options"
                >
                  <Ellipsis className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-[8rem] rounded-xl border-sidebar-border/80 shadow-lg"
                side="right"
                align="start"
                forceMount
                sideOffset={20}
              >
                <DropdownMenuItem className="cursor-pointer" onClick={onRename}>
                  <Translator path="threadHistory.thread.menu.rename" />
                  <Pencil className="ml-auto h-4 w-4 opacity-60" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 dark:text-red-400 cursor-pointer"
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

export function GroupedChatSection() {
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

  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
        setDeleteGroupId(null);
        return <Translator path="threadHistory.sidebar.deleteGroup.success" />;
      },
      error: (err) => {
        if (err instanceof ClientError) return <span>{err.message}</span>;
        return <Translator path="threadHistory.sidebar.deleteGroup.error" />;
      }
    });
  }, [apiClient, deleteGroupId, setThreadGroups, setThreadHistory]);

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
    <section className="shrink-0 flex flex-col gap-2" aria-label="Grouped chat">
      <Button
        onClick={() => setSectionExpanded((prev) => !prev)}
        variant="ghost"
        size="default"
        className="w-full justify-between gap-2 rounded-lg h-9 px-3 border border-sidebar-border/60 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors duration-150"
        aria-expanded={sectionExpanded}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          <Translator path="threadHistory.sidebar.groupedChat" />
        </span>

        {sectionExpanded ? (
          <ChevronDown className="size-4 shrink-0" />
        ) : (
          <ChevronRight className="size-4 shrink-0" />
        )}
      </Button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          sectionExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
        aria-hidden={!sectionExpanded}
      >
        <div className="min-h-0 overflow-hidden">
          <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <DragStateSync setActiveId={setDragActiveId} setOverId={setDragOverId} />
            <SortableContext
              items={threadGroups.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 px-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/80"
                  onClick={() => setCreateDialogOpen(true)}
                  aria-label={t('threadHistory.sidebar.createGroupTitle')}
                >
                  <FolderPlus className="size-4 shrink-0" />
                  <span className="truncate text-sm font-medium">
                    <Translator path="threadHistory.sidebar.createGroupTitle" />
                  </span>
                </Button>
                {threadGroups.map((group) => {
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

                  return (
                    <SortableGroupRow
                      key={group.id}
                      group={group}
                      isExpanded={isExpanded}
                      onToggle={() => toggleGroup(group.id)}
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
                          'grid transition-[grid-template-rows] duration-200 ease-out',
                          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        )}
                        aria-hidden={!isExpanded}
                      >
                        <SidebarGroupContent className="min-h-0 overflow-hidden">
                          <SidebarMenu className="gap-0">
                            {isExpanded && sortedKeys.length > 0 && (
                              <ThreadList
                                threadHistory={groupHistory}
                                error={undefined}
                                isFetching={false}
                                isLoadingMore={false}
                                collapsedGroups={null}
                                setCollapsedGroups={undefined}
                              />
                            )}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </div>
                    </SortableGroupRow>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
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
    </section>
  );
}
