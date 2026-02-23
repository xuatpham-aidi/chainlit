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
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { FolderPlus } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  SidebarGroupContent,
  SidebarMenu
} from '@/components/ui/sidebar';

import {
  SIDEBAR_SECTION_INNER_GAP,
  SIDEBAR_ACTION_BUTTON,
  SIDEBAR_TOPIC_TO_CHILDREN_GAP,
  SIDEBAR_TIME_GROUP_ROW_STICKY_TOP,
  SIDEBAR_TREE_CONNECTOR,
  SIDEBAR_FOLDER_CHILDREN_PL
} from './layout';
import { Translator } from '../i18n';
import { SidebarSection } from './SidebarSection';
import { ThreadList } from './ThreadList';
import { getSortedTimeGroupKeys } from './utils';
import { TopicGroupRow, DragStateSync } from './TopicGroupRow';
import { GroupedChatDialogs } from './GroupedChatDialogs';
import type { GroupedChatSectionProps, ThreadGroupRecord } from './types';
import { DRAG_ACTIVATION_DISTANCE_PX, CLICK_AFTER_DRAG_SUPPRESS_MS } from './constants';

export type { GroupedChatSectionProps } from './types';

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
      sectionBackground="topics"
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
                  <TopicGroupRow
                    key={group.id}
                    group={group as ThreadGroupRecord}
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
                      <div
                        className={cn(
                          'min-h-0 min-w-0 overflow-clip rounded-xl relative',
                          isExpanded && SIDEBAR_TOPIC_TO_CHILDREN_GAP,
                          isExpanded && SIDEBAR_FOLDER_CHILDREN_PL,
                          isExpanded && SIDEBAR_TREE_CONNECTOR
                        )}
                      >
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
                                folderTreeStyle
                              />
                            )}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </div>
                    </div>
                  </TopicGroupRow>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <GroupedChatDialogs
        createDialogOpen={createDialogOpen}
        onCreateDialogOpenChange={setCreateDialogOpen}
        newGroupName={newGroupName}
        onNewGroupNameChange={setNewGroupName}
        onCreateGroup={handleCreateGroup}
        renameGroupId={renameGroupId}
        renameGroupName={renameGroupName}
        onRenameGroupNameChange={setRenameGroupName}
        onRenameGroup={handleRenameGroup}
        onRenameDialogClose={() => {
          setRenameGroupId(null);
          setRenameGroupName('');
        }}
        deleteGroupId={deleteGroupId}
        onDeleteGroupIdChange={setDeleteGroupId}
        onDeleteGroup={handleDeleteGroup}
        createGroupPlaceholder={t('threadHistory.sidebar.createGroupPlaceholder')}
        renamePlaceholder={t('threadHistory.sidebar.createGroupPlaceholder')}
      />
    </SidebarSection>
  );
}
