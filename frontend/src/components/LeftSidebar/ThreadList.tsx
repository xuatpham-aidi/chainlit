import { cn } from '@/lib/utils';
import { size } from 'lodash';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  MessageSquare,
  Share2
} from 'lucide-react';
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
  useChatInteract,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { Loader } from '@/components/Loader';
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
import { Label } from '@/components/ui/label';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

import { Translator } from '../i18n';
import {
  loadCollapsedGroups,
  saveCollapsedGroups
} from './ThreadCollapse';
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
  collapsedGroups?: Set<string> | null;
  setCollapsedGroups?: React.Dispatch<
    React.SetStateAction<Set<string> | null>
  >;
}

export function ThreadList({
  threadHistory,
  error,
  isFetching,
  isLoadingMore,
  collapsedGroups: controlledCollapsed,
  setCollapsedGroups: setControlledCollapsed
}: ThreadListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idToResume } = useChatSession();
  const { clear } = useChatInteract();
  const { threadId: currentThreadId } = useChatMessages();
  const [threadIdToDelete, setThreadIdToDelete] = useState<string>();
  const [threadIdToRename, setThreadIdToRename] = useState<string>();
  const [threadNewName, setThreadNewName] = useState<string>();
  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
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

  const [internalCollapsed, setInternalCollapsed] = useState<Set<string> | null>(
    loadCollapsedGroups
  );

  const isControlled =
    controlledCollapsed !== undefined && setControlledCollapsed !== undefined;
  const collapsedGroups = isControlled ? controlledCollapsed : internalCollapsed;
  const setCollapsedGroups = isControlled
    ? setControlledCollapsed!
    : setInternalCollapsed;

  useEffect(() => {
    if (isControlled) return;
    if (collapsedGroups === null && sortedTimeGroupKeys.length > 0) {
      const allCollapsed = new Set(sortedTimeGroupKeys);
      setInternalCollapsed(allCollapsed);
      saveCollapsedGroups(allCollapsed);
    }
  }, [isControlled, collapsedGroups, sortedTimeGroupKeys]);

  const effectiveCollapsed =
    collapsedGroups === null ? new Set(sortedTimeGroupKeys) : collapsedGroups;

  const toggleGroup = useCallback(
    (group: string) => {
      setCollapsedGroups((prev) => {
        const base = prev ?? new Set(sortedTimeGroupKeys);
        const next = new Set(base);
        if (next.has(group)) next.delete(group);
        else next.add(group);
        saveCollapsedGroups(next);
        return next;
      });
    },
    [setCollapsedGroups, sortedTimeGroupKeys]
  );

  const expandAllGroups = useCallback(() => {
    setCollapsedGroups(() => {
      const next = new Set<string>();
      saveCollapsedGroups(next);
      return next;
    });
  }, [setCollapsedGroups]);

  const collapseAllGroups = useCallback(() => {
    setCollapsedGroups(() => {
      const next = new Set(sortedTimeGroupKeys);
      saveCollapsedGroups(next);
      return next;
    });
  }, [setCollapsedGroups, sortedTimeGroupKeys]);

  const handleShareThread = (threadId: string) => {
    if (!threadSharingReady) return;
    setThreadIdToShare(threadId);
    setIsShareDialogOpen(true);
    // ShareDialog handles its own internal state; we just open it
  };

  const hasNoThreads =
    !threadHistory?.timeGroupedThreads ||
    size(threadHistory.timeGroupedThreads) === 0;

  if (error) {
    return (
      <Alert variant="error" className="m-3">
        {error}
      </Alert>
    );
  }

  if (hasNoThreads && (isFetching || isLoadingMore)) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader />
      </div>
    );
  }

  if (hasNoThreads) {
    return (
      <Alert variant="info" className="m-3">
        <Translator path="threadHistory.sidebar.empty" />
      </Alert>
    );
  }

  const handleDeleteThread = async () => {
    if (!threadIdToDelete) return;
    if (
      threadIdToDelete === idToResume ||
      threadIdToDelete === currentThreadId
    ) {
      clear();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    
    clear();
    await new Promise((resolve) => setTimeout(resolve, 300));

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
        {sortedTimeGroupKeys.length > 1 && !isControlled ? (
          <div className="px-2 pb-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={
                    effectiveCollapsed.size === 0
                      ? collapseAllGroups
                      : expandAllGroups
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                  aria-label={
                    effectiveCollapsed.size === 0
                      ? t('threadHistory.sidebar.collapseAll', 'Collapse all')
                      : t('threadHistory.sidebar.expandAll', 'Expand all')
                  }
                >
                  {effectiveCollapsed.size === 0 ? (
                    <ChevronsUp className="h-4 w-4" aria-hidden />
                  ) : (
                    <ChevronsDown className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {effectiveCollapsed.size === 0
                  ? t('threadHistory.sidebar.collapseAll', 'Collapse all')
                  : t('threadHistory.sidebar.expandAll', 'Expand all')}
              </TooltipContent>
            </Tooltip>
          </div>
        ) : null}
        {sortedTimeGroupKeys.map((group, groupIndex) => {
          const items = threadHistory!.timeGroupedThreads![group];
          const isCollapsed = effectiveCollapsed.has(group);
          const count = items.length;
          return (
            <SidebarGroup
              key={group}
              className={cn(
                'p-2',
                groupIndex > 0 && 'mt-1 pt-3 border-t border-sidebar-border/60'
              )}
            >
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className={cn(
                  'flex w-full items-center gap-1.5 rounded-md py-1.5 px-2 -mx-0.5',
                  'text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60',
                  'hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80',
                  'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'
                )}
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                <span className="flex-1 text-left">
                  {getTimeGroupLabel(group)}
                </span>
                <span className="text-[10px] font-normal tabular-nums text-sidebar-foreground/50">
                  {count}
                </span>
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-out',
                  isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                )}
                aria-hidden={isCollapsed}
              >
                <SidebarGroupContent className="min-h-0 overflow-hidden px-0">
                  <SidebarMenu className="gap-0.5">
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
                        style={{ animationDelay: `${itemIndex * 40}ms` }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={isResumed ? '' : `/thread/${thread.id}`}>
                              <SidebarMenuButton
                                isActive={isSelected}
                                className={cn(
                                  'relative h-10 min-h-10 group/thread rounded-lg px-2.5 transition-colors',
                                  isSelected &&
                                    'border-l-2 border-l-primary pl-[6px]'
                                )}
                              >
                                <span className="flex min-w-0 flex-1 items-center gap-2.5 pr-1">
                                  {thread.metadata?.is_shared ? (
                                    <Share2
                                      className="h-4 w-4 shrink-0 text-muted-foreground"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <MessageSquare
                                      className={cn(
                                        'h-4 w-4 shrink-0',
                                        isSelected
                                          ? 'text-sidebar-accent-foreground'
                                          : 'text-muted-foreground'
                                      )}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span className="truncate text-left">
                                    {displayName}
                                  </span>
                                </span>
                                <ThreadOptions
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
                                  disabled={isFetching || isLoadingMore}
                                  className={cn(
                                    'shrink-0 h-8 w-8 rounded-md flex opacity-0 group-hover/thread:opacity-100 transition-opacity',
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
      {(isFetching || isLoadingMore) ? (
        <div className="flex items-center justify-center p-2">
          <Loader />
        </div>
      ) : null}
    </>
  );
}
