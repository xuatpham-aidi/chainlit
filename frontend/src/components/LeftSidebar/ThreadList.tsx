import { cn } from '@/lib/utils';
import { size } from 'lodash';
import { MessageSquare, Share2 } from 'lucide-react';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  ClientError,
  ThreadHistory,
  threadHistoryState,
  threadGroupsState,
  useChatInteract,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';

import Alert from '@/components/Alert';
import ShareDialog from '@/components/share/ShareDialog';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import {
  SIDEBAR_GROUP_BLOCK_PADDING,
  SIDEBAR_GROUP_BLOCK_SELECTED,
  SIDEBAR_LEVEL_1_PL,
  SIDEBAR_LEVEL_2_PL,
  SIDEBAR_TIME_GROUP_ROW_STICKY,
  SIDEBAR_TIME_GROUP_ROW_WRAPPER,
  SIDEBAR_THREAD_ITEM_PADDING,
  SIDEBAR_THREAD_ITEM_TEXT,
  SIDEBAR_THREAD_ITEM_DEFAULT,
  SIDEBAR_THREAD_ITEM_HOVER,
  SIDEBAR_THREAD_ITEM_ACTIVE,
  SIDEBAR_THREAD_ITEM_OPEN,
  SIDEBAR_THREAD_ICON_SIZE,
  SIDEBAR_TIME_GROUP_ROW
} from './layout';
import { Translator } from '../i18n';
import { CollapsibleGroupRow } from './CollapsibleGroupRow';
import ThreadOptions from './ThreadOptions';

const TIME_GROUP_ORDER = [
  'Today',
  'Yesterday',
  'Previous 7 days',
  'Previous 30 days'
];

export function getSortedTimeGroupKeys(
  timeGroupedThreads: Record<string, unknown[]> | undefined
): string[] {
  if (!timeGroupedThreads) return [];
  return Object.keys(timeGroupedThreads).sort((a, b) => {
    const aIndex = TIME_GROUP_ORDER.indexOf(a);
    const bIndex = TIME_GROUP_ORDER.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}

interface ThreadListProps {
  threadHistory?: ThreadHistory;
  error?: string;
  isFetching: boolean;
  isLoadingMore: boolean;
  collapsedGroups: Set<string> | null;
  setCollapsedGroups: React.Dispatch<
    React.SetStateAction<Set<string> | null>
  >;
  /** When set, time group headers stick at this offset (e.g. top-18) below parent headers. */
  stickyTopOffset?: string;
  /** When true, remove top padding from the first time group (e.g. when nested under a topic in GroupedChatSection). */
  compactFirstGroup?: boolean;
}

export function ThreadList({
  threadHistory,
  error,
  isFetching,
  isLoadingMore,
  collapsedGroups,
  setCollapsedGroups,
  stickyTopOffset = 'top-0',
  compactFirstGroup = false
}: ThreadListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idToResume } = useChatSession();
  const { clear } = useChatInteract();
  const { threadId: currentThreadId } = useChatMessages();
  const [threadIdToDelete, setThreadIdToDelete] = useState<string>();
  const [threadIdToRename, setThreadIdToRename] = useState<string>();
  const [threadNewName, setThreadNewName] = useState<string>();
  const [openTooltipThreadId, setOpenTooltipThreadId] = useState<string | null>(
    null
  );
  const [openDropdownThreadId, setOpenDropdownThreadId] = useState<
    string | null
  >(null);
  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const threadGroups = useRecoilValue(threadGroupsState) ?? [];
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();

  const handleMoveToGroup = useCallback(
    (threadId: string, groupId: string | null) => {
      const effectiveGroupId = groupId ?? undefined;
      const thread = threadHistory?.threads?.find((t) => t.id === threadId);
      if (thread && (thread.groupId ?? undefined) === effectiveGroupId) return;
      toast.promise(apiClient.moveThreadToGroup(threadId, groupId), {
        loading: <Translator path="threadHistory.thread.actions.moveToGroup.inProgress" />,
        success: () => {
          setThreadHistory((prev) => ({
            ...prev,
            threads: prev?.threads?.map((t) =>
              t.id === threadId ? { ...t, groupId: effectiveGroupId } : t
            )
          }));
          return <Translator path="threadHistory.thread.actions.moveToGroup.success" />;
        },
        error: (err) => {
          if (err instanceof ClientError) return <span>{err.message}</span>;
          return <Translator path="threadHistory.thread.actions.moveToGroup.error" />;
        }
      });
    },
    [apiClient, setThreadHistory, threadHistory?.threads]
  );
  const dataPersistence = config?.dataPersistence;
  const threadSharingReady = Boolean((config as any)?.threadSharing);
  // sessionId not needed here

  // Share thread state
  const [threadIdToShare, setThreadIdToShare] = useState<string | undefined>();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  // Share dialog state is centralized in ShareDialog; we only track which thread to share

  const sortedTimeGroupKeys = useMemo(
    () => getSortedTimeGroupKeys(threadHistory?.timeGroupedThreads),
    [threadHistory?.timeGroupedThreads]
  );

  const effectiveCollapsed =
    collapsedGroups === null
      ? new Set(sortedTimeGroupKeys)
      : collapsedGroups;

  const toggleGroup = useCallback(
    (group: string) => {
      setCollapsedGroups((prev) => {
        const base =
          prev ?? new Set(sortedTimeGroupKeys);
        const next = new Set(base);
        if (next.has(group)) next.delete(group);
        else next.add(group);
        return next;
      });
    },
    [setCollapsedGroups, sortedTimeGroupKeys]
  );

  const handleShareThread = (threadId: string) => {
    if (!threadSharingReady) return;
    setThreadIdToShare(threadId);
    setIsShareDialogOpen(true);
    // ShareDialog handles its own internal state; we just open it
  };

  const hasNoThreads =
    !threadHistory?.timeGroupedThreads ||
    size(threadHistory.timeGroupedThreads) === 0;

  const isLoading = isFetching || isLoadingMore;

  const handleDeleteThread = async () => {
    if (!threadIdToDelete) return;
    if (
      threadIdToDelete === idToResume ||
      threadIdToDelete === currentThreadId
    ) {
      clear();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    toast.promise(apiClient.deleteThread(threadIdToDelete), {
      loading: (
        <Translator path="threadHistory.thread.actions.delete.inProgress" />
      ),
      success: () => {
        setThreadHistory((prev) => ({
          ...prev,
          threads: prev?.threads?.filter((t) => t.id !== threadIdToDelete)
        }));
        navigate('/');
        return (
          <Translator path="threadHistory.thread.actions.delete.success" />
        );
      },
      error: (err) => {
        if (err instanceof ClientError) {
          return <span>{err.message}</span>;
        } else {
          return <span></span>;
        }
      }
    });
  };

  const handleRenameThread = () => {
    if (!threadIdToRename || !threadNewName) return;

    toast.promise(apiClient.renameThread(threadIdToRename, threadNewName), {
      loading: (
        <Translator path="threadHistory.thread.actions.rename.inProgress" />
      ),
      success: () => {
        setThreadNewName(undefined);
        setThreadIdToRename(undefined);
        setThreadHistory((prev) => {
          const next = {
            ...prev,
            threads: prev?.threads ? [...prev.threads] : undefined
          };
          const threadIndex = next.threads?.findIndex(
            (t) => t.id === threadIdToRename
          );
          if (typeof threadIndex === 'number' && next.threads) {
            next.threads[threadIndex] = {
              ...next.threads[threadIndex],
              name: threadNewName
            };
          }
          return next;
        });
        return (
          <div>
            <Translator path="threadHistory.thread.actions.rename.success" />
          </div>
        );
      },
      error: (err) => {
        if (err instanceof ClientError) {
          return <span>{err.message}</span>;
        } else {
          return <span></span>;
        }
      }
    });
  };

  const getTimeGroupLabel = (group: string) => {
    const labels = {
      Today: <Translator path="threadHistory.sidebar.timeframes.today" />,
      Yesterday: (
        <Translator path="threadHistory.sidebar.timeframes.yesterday" />
      ),
      'Previous 7 days': (
        <Translator path="threadHistory.sidebar.timeframes.previous7days" />
      ),
      'Previous 30 days': (
        <Translator path="threadHistory.sidebar.timeframes.previous30days" />
      )
    };
    return labels[group as keyof typeof labels] || group;
  };

  return (
    <>
      <AlertDialog
        open={!!threadIdToDelete}
        onOpenChange={() => setThreadIdToDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Translator path="threadHistory.thread.actions.delete.title" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Translator path="threadHistory.thread.actions.delete.description" />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">
              <Translator path="common.actions.cancel" />
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThread}>
              <Translator path="common.actions.confirm" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!threadIdToRename}
        onOpenChange={() => setThreadIdToRename(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Translator path="threadHistory.thread.actions.rename.title" />
            </DialogTitle>
            <DialogDescription>
              {/* <Translator path="threadHistory.thread.actions.rename.description" /> */}
            </DialogDescription>
          </DialogHeader>
          <div className="my-6">
            {/* <Label htmlFor="name" className="text-right">
              <Translator path="threadHistory.thread.actions.rename.form.name.label" />
            </Label> */}
            <Input
              id="name"
              required
              value={threadNewName}
              onChange={(e) => setThreadNewName(e.target.value)}
              placeholder={t(
                'threadHistory.thread.actions.rename.form.name.placeholder'
              )}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setThreadIdToRename(undefined)}
            >
              <Translator path="common.actions.cancel" />
            </Button>
            <Button type="button" onClick={handleRenameThread}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={(open) => {
          setIsShareDialogOpen(open);
          if (!open) {
            setThreadIdToShare(undefined);
          }
        }}
        threadId={threadIdToShare || null}
      />
      <TooltipProvider delayDuration={300}>
        {error ? (
          <div className="px-2 py-3">
            <Alert variant="error" className="rounded-2xl border-sidebar-border/70">
              {error}
            </Alert>
          </div>
        ) : hasNoThreads && !isLoading ? (
          <div className="px-2 py-4">
            <Alert variant="info" className="rounded-2xl border-sidebar-border/70 text-sidebar-foreground/90">
              <Translator path="threadHistory.sidebar.empty" />
            </Alert>
          </div>
        ) : null}
        {!error &&
          !hasNoThreads &&
          sortedTimeGroupKeys.map((group, groupIndex) => {
            const items = threadHistory!.timeGroupedThreads![group];
            const currentId = threadHistory!.currentThreadId ?? idToResume;
            const groupContainsSelected = Boolean(
              currentId && items.some((t) => t.id === currentId)
            );
            const isCollapsed = effectiveCollapsed.has(group);
            const count = items.length;
            return (
              <SidebarGroup
                key={group}
                className={cn(
                  'px-0',
                  SIDEBAR_GROUP_BLOCK_PADDING,
                  groupIndex === 0 && compactFirstGroup && 'pt-0',
                  groupIndex > 0 && 'mt-3',
                  groupContainsSelected && SIDEBAR_GROUP_BLOCK_SELECTED
                )}
              >
                <div className={cn(SIDEBAR_TIME_GROUP_ROW_STICKY, SIDEBAR_TIME_GROUP_ROW_WRAPPER, stickyTopOffset)}>
                  <CollapsibleGroupRow
                    label={getTimeGroupLabel(group)}
                    count={count}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleGroup(group)}
                    containsSelected={groupContainsSelected}
                    className={cn(SIDEBAR_TIME_GROUP_ROW, compactFirstGroup && SIDEBAR_LEVEL_1_PL)}
                  />
                </div>
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-out',
                    isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                  )}
                  aria-hidden={isCollapsed}
                >
                  <SidebarGroupContent className="min-h-0 overflow-hidden px-0">
                    <SidebarMenu
                      key={`${group}-${isCollapsed}`}
                      className="gap-1"
                    >
                      {items.map((thread, itemIndex) => {
                        const isResumed =
                          idToResume === thread.id &&
                          !threadHistory!.currentThreadId;
                        const isSelected =
                          isResumed || threadHistory!.currentThreadId === thread.id;
                        const displayName =
                          thread.name || (
                            <Translator path="threadHistory.thread.untitled" />
                          );
                        return (
                          <SidebarMenuItem
                            key={thread.id}
                            id={`thread-${thread.id}`}
                            className="list-none thread-item-reveal"
                            style={{ animationDelay: `${itemIndex * 35}ms` }}
                          >
                            <Tooltip
                              open={
                                openTooltipThreadId === thread.id &&
                                openDropdownThreadId !== thread.id
                              }
                              onOpenChange={(open) =>
                                setOpenTooltipThreadId((prev) =>
                                  open ? thread.id : prev === thread.id ? null : prev
                                )
                              }
                            >
                              <TooltipTrigger asChild>
                                <Link to={isResumed ? '' : `/thread/${thread.id}`}>
                                    <SidebarMenuButton
                                    isActive={isSelected}
                                    className={cn(
                                      'relative group/thread transition-colors duration-200 ease-out',
                                      SIDEBAR_THREAD_ITEM_PADDING,
                                      compactFirstGroup ? SIDEBAR_LEVEL_2_PL : SIDEBAR_LEVEL_1_PL,
                                      SIDEBAR_THREAD_ITEM_DEFAULT,
                                      SIDEBAR_THREAD_ITEM_HOVER,
                                      isSelected && SIDEBAR_THREAD_ITEM_ACTIVE,
                                      (openDropdownThreadId === thread.id ||
                                        threadIdToDelete === thread.id ||
                                        threadIdToRename === thread.id ||
                                        (threadIdToShare === thread.id &&
                                          isShareDialogOpen)) &&
                                        !isSelected &&
                                        SIDEBAR_THREAD_ITEM_OPEN
                                    )}
                                  >
                                    <span className="flex min-w-0 flex-1 items-center gap-2 pl-0">
                                      {thread.metadata?.is_shared ? (
                                        <Share2
                                          className={cn(
                                            SIDEBAR_THREAD_ICON_SIZE,
                                            'shrink-0 text-sidebar-foreground/70'
                                          )}
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <MessageSquare
                                          className={cn(
                                            SIDEBAR_THREAD_ICON_SIZE,
                                            'shrink-0 transition-colors duration-200',
                                            isSelected
                                              ? 'text-sidebar-foreground'
                                              : 'text-sidebar-foreground/55'
                                          )}
                                          aria-hidden="true"
                                        />
                                      )}
                                      <span className={cn('truncate text-left', SIDEBAR_THREAD_ITEM_TEXT)}>
                                        {displayName}
                                      </span>
                                    </span>
                                    <ThreadOptions
                                      threadId={thread.id}
                                      threadGroupId={thread.groupId}
                                      threadGroups={threadGroups}
                                      onMoveToGroup={handleMoveToGroup}
                                      onDelete={() =>
                                        setThreadIdToDelete(thread.id)
                                      }
                                      onRename={() => {
                                        setThreadIdToRename(thread.id);
                                        setThreadNewName(thread.name);
                                      }}
                                      onShare={
                                        dataPersistence && threadSharingReady
                                          ? () => handleShareThread(thread.id)
                                          : undefined
                                      }
                                      onDropdownOpenChange={(open) =>
                                        setOpenDropdownThreadId(open ? thread.id : null)
                                      }
                                      disabled={isLoading}
                                      className={cn(
                                        'shrink-0 h-9 w-9 rounded-2xl flex opacity-0 group-hover/thread:opacity-100 transition-opacity duration-200',
                                        isSelected && 'opacity-100'
                                      )}
                                    />
                                  </SidebarMenuButton>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right" align="center">
                                <p className="max-w-xs truncate">
                                  {thread.name || t('threadHistory.thread.untitled')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </div>
              </SidebarGroup>
            );
          })}
      </TooltipProvider>
    </>
  );
}
