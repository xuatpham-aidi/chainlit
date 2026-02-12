import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import {
  ChainlitContext,
  groupByDate,
  threadGroupsState,
  threadHistoryState,
  useConfig
} from '@chainlit/react-client';

import {
  sidebarRecentTimeGroupCollapsedState,
  sidebarTopicGroupExpandedState
} from '@/state/sidebar';

import { Logo } from '@/components/Logo';
import SidebarTrigger from '@/components/header/SidebarTrigger';
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar';

import NewChatButton from '../header/NewChat';
import SearchChats from './Search';
import { ChatHistorySection } from './ChatHistorySection';
import { getSortedTimeGroupKeys } from './ThreadList';

export default function LeftSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const threadHistory = useRecoilValue(threadHistoryState);
  const setThreadGroups = useSetRecoilState(threadGroupsState);
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const dataPersistence = config?.dataPersistence;

  const ungroupedThreads = useMemo(
    () =>
      (threadHistory?.threads ?? []).filter(
        (thread: { groupId?: string | null }) =>
          thread.groupId == null || thread.groupId === ''
      ),
    [threadHistory?.threads]
  );
  const ungroupedTimeGrouped = useMemo(
    () => groupByDate(ungroupedThreads),
    [ungroupedThreads]
  );
  const sortedTimeGroupKeys = useMemo(
    () => getSortedTimeGroupKeys(ungroupedTimeGrouped),
    [ungroupedTimeGrouped]
  );

  const [collapsedGroups, setCollapsedGroups] = useRecoilState(
    sidebarRecentTimeGroupCollapsedState
  );
  const setSidebarTopicGroupExpanded = useSetRecoilState(
    sidebarTopicGroupExpandedState
  );

  const effectiveCollapsed = useMemo(
    () =>
      collapsedGroups === null
        ? new Set(sortedTimeGroupKeys)
        : collapsedGroups,
    [collapsedGroups, sortedTimeGroupKeys]
  );

  const collapseAllGroups = useCallback(() => {
    setCollapsedGroups(new Set(sortedTimeGroupKeys));
    setSidebarTopicGroupExpanded(new Set());
  }, [sortedTimeGroupKeys, setCollapsedGroups, setSidebarTopicGroupExpanded]);

  const allGroupsCollapsed =
    sortedTimeGroupKeys.length > 0 &&
    effectiveCollapsed.size === sortedTimeGroupKeys.length;
  const hasUncollapsedRecentGroups =
    sortedTimeGroupKeys.length > 0 &&
    effectiveCollapsed.size < sortedTimeGroupKeys.length;

  const historyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dataPersistence || !apiClient?.listThreadGroups) return;
    apiClient
      .listThreadGroups()
      .then((groups) => {
        const byDisplayOrder = [...groups].sort((a, b) => {
          const oa = a.displayOrder ?? 0;
          const ob = b.displayOrder ?? 0;
          if (oa !== ob) return oa - ob;
          return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
        });
        setThreadGroups(byDisplayOrder);
      })
      .catch(() => setThreadGroups([]));
  }, [dataPersistence, apiClient, setThreadGroups]);

  const barClassName =
    'w-full justify-between gap-2 rounded-lg h-9 px-3 border border-sidebar-border/60 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors duration-150 flex items-center';

  return (
    <Sidebar {...props} className="border-none bg-sidebar flex flex-col" >
      <SidebarHeader className="sidebar-header-nbc flex flex-col gap-2 border-b border-sidebar-border/80 px-3 py-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <Logo className="h-8 w-auto max-w-[140px] shrink-0" />
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <div className="flex flex-1 flex-col min-h-0 px-3 py-3 gap-4">
        <section className="shrink-0" aria-label="New chat">
          <NewChatButton
            navigate={navigate}
            showLabel
            className={barClassName}
          />
        </section>

        <section className="shrink-0" aria-label="Search">
          <SearchChats triggerVariant="bar" />
        </section>

        <section
          className="flex flex-1 flex-col min-h-0 pt-8 gap-4 overflow-clip"
          aria-label="Chat history"
        >
          <ChatHistorySection
            historyScrollRef={historyScrollRef}
            onHistoryScroll={() => { }}
            registerScrollHandler={() => { }}
            collapsedGroups={collapsedGroups}
            setCollapsedGroups={setCollapsedGroups}
            onCollapseAll={collapseAllGroups}
            hideScrollbar={allGroupsCollapsed}
            invalidateKey={
              collapsedGroups
                ? Array.from(collapsedGroups).sort().join(',')
                : ''
            }
            threadsFilter={(t) => t.groupId == null || t.groupId === ''}
            ungroupedSectionTitle="threadHistory.sidebar.ungroupedChat"
            hasUncollapsedRecentGroups={hasUncollapsedRecentGroups}
          />
        </section>
      </div>
    </Sidebar>
  );
}
