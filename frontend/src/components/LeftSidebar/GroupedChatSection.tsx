import {
  DndContext,
  DragEndEvent,
  PointerSensor,
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
  GripVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { useCallback, useContext, useMemo, useState } from 'react';
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

interface IThreadGroup {
  id: string;
  userId: string;
  name: string;
  displayOrder: number;
  createdAt?: string;
}

interface SortableGroupRowProps {
  group: IThreadGroup;
  threads: Array<{ id: string; groupId?: string | null }>;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

function SortableGroupRow({
  group,
  threads,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  children
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
  return (
    <SidebarGroup className="px-0 py-0 group/row">
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          'flex items-center gap-0 w-full rounded-lg overflow-hidden cursor-grab active:cursor-grabbing touch-none',
          isDragging && 'opacity-60 z-10 shadow-md'
        )}
        aria-label="Drag to reorder group"
      >
        <div className="p-1 shrink-0 text-sidebar-foreground/50 rounded-l-md pointer-events-none">
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
        </div>
        <button
          type="button"
          onClick={onToggle}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            'flex flex-1 min-w-0 items-center gap-2 rounded-r-lg py-1.5 pl-2 pr-2 text-left',
            'text-xs font-medium tracking-tight bg-neutral-300/20',
            'hover:bg-neutral-300/50 transition-colors duration-150'
          )}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="flex-1 truncate">{group.name}</span>
          <span className="text-sidebar-foreground/45 text-sm shrink-0">
            {threads.length}
          </span>
        </button>
        <div
          className="flex items-center shrink-0 bg-neutral-300/20 opacity-0 group-hover/row:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'h-7 w-7 rounded-r-lg'
                )}
                aria-label="Group options"
              >
                <Ellipsis className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[8rem]">
              <DropdownMenuItem onClick={onRename}>
                <Translator path="threadHistory.thread.menu.rename" />
                <Pencil className="ml-auto h-4 w-4 opacity-60" />
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 dark:text-red-400"
                onClick={onDelete}
              >
                <Translator path="threadHistory.thread.menu.delete" />
                <Trash2 className="ml-auto h-4 w-4 opacity-60" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {children}
    </SidebarGroup>
  );
}


export function GroupedChatSection() {
  const { t } = useTranslation();
  const { config } = useConfig();
  const dataPersistence = config?.dataPersistence;
  const apiClient = useContext(ChainlitContext);
  const threadGroups = useRecoilValue(threadGroupsState) ?? [];
  const setThreadGroups = useSetRecoilState(threadGroupsState);
  const threadHistory = useRecoilValue(threadHistoryState);
  const setThreadHistory = useSetRecoilState(threadHistoryState);

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
    toast.promise(apiClient.createThreadGroup(name), {
      loading: <Translator path="threadHistory.sidebar.createGroup.inProgress" />,
      success: (created) => {
        setThreadGroups((prev) => [...(prev ?? []), created]);
        setNewGroupName('');
        setCreateDialogOpen(false);
        return <Translator path="threadHistory.sidebar.createGroup.success" />;
      },
      error: (err) => {
        if (err instanceof ClientError) return <span>{err.message}</span>;
        return <Translator path="threadHistory.sidebar.createGroup.error" />;
      }
    });
  }, [apiClient, newGroupName, setThreadGroups]);

  const handleRenameGroup = useCallback(async () => {
    if (!renameGroupId || !renameGroupName.trim() || !apiClient.updateThreadGroup)
      return;
    try {
      await apiClient.updateThreadGroup(renameGroupId, {
        name: renameGroupName.trim()
      });
      setThreadGroups((prev) =>
        (prev ?? []).map((g) =>
          g.id === renameGroupId ? { ...g, name: renameGroupName.trim() } : g
        )
      );
      setRenameGroupId(null);
      setRenameGroupName('');
    } catch {
      toast.error('Failed to rename group');
    }
  }, [apiClient, renameGroupId, renameGroupName, setThreadGroups]);

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
      activationConstraint: { distance: 8 }
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = threadGroups.findIndex(
        (g: IThreadGroup) => g.id === String(active.id)
      );
      const newIndex = threadGroups.findIndex(
        (g: IThreadGroup) => g.id === String(over.id)
      );
      if (oldIndex < 0 || newIndex < 0) return;
      const reordered = arrayMove(threadGroups, oldIndex, newIndex);
      const orderedIds = reordered.map((g: IThreadGroup) => g.id);
      setThreadGroups(reordered);
      try {
        await apiClient.reorderThreadGroups(orderedIds);
      } catch {
        setThreadGroups(threadGroups);
        toast.error('Failed to reorder groups');
      }
    },
    [apiClient, threadGroups, setThreadGroups]
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
            <SortableContext
              items={threadGroups.map((g: IThreadGroup) => g.id)}
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
                  return (
                    <SortableGroupRow
                      key={group.id}
                      group={group}
                      threads={threads}
                      isExpanded={isExpanded}
                      onToggle={() => toggleGroup(group.id)}
                      onRename={() => {
                        setRenameGroupId(group.id);
                        setRenameGroupName(group.name);
                      }}
                      onDelete={() => setDeleteGroupId(group.id)}
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
