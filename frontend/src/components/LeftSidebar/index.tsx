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
import { cn } from '@/lib/utils';

import {
  SIDEBAR_OUTER_GAP,
  SIDEBAR_CONTENT_PX,
  SIDEBAR_CTA_PRIMARY,
  SIDEBAR_ACTION_SECONDARY,
  SIDEBAR_MAIN_BG,
  SIDEBAR_GAP_SEPARATOR,
  SIDEBAR_HEADER_BORDER
} from './layout';
import NewChatButton from '../header/NewChat';
import SearchChats from './Search';
import { ChatHistorySection } from './ChatHistorySection';
import { getSortedTimeGroupKeys } from './utils';

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
  const expandedTopicGroups = useRecoilValue(sidebarTopicGroupExpandedState);
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
  const hasExpandedTopicGroups = expandedTopicGroups.size > 0;
  const hideScrollbar =
    allGroupsCollapsed && !hasExpandedTopicGroups;
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

  return (
    <Sidebar
      {...props}
      className={cn(
        'border-r bg-sidebar flex flex-col min-w-0 overflow-hidden',
        SIDEBAR_HEADER_BORDER
      )}
    >
      <SidebarHeader
        className={cn(
          'sidebar-header-nbc flex flex-col gap-3 border-b pl-3 pr-2 py-3.5 shrink-0 bg-sidebar',
          SIDEBAR_HEADER_BORDER
        )}
      >
        <div className="flex items-center justify-between gap-2 min-h-8">
          <Logo className="h-6 w-auto max-w-[120px] shrink-0" />
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <div
        className={cn(
          'flex flex-1 flex-col min-h-0 min-w-0 overflow-x-hidden py-3',
          SIDEBAR_CONTENT_PX,
          SIDEBAR_OUTER_GAP,
          SIDEBAR_MAIN_BG
        )}
      >
        <section className="shrink-0" aria-label="New chat">
          <NewChatButton
            navigate={navigate}
            showLabel
            className={SIDEBAR_CTA_PRIMARY}
          />
        </section>

        <section
          className={cn('shrink-0', SIDEBAR_GAP_SEPARATOR)}
          aria-label="Search"
        >
          <SearchChats triggerVariant="bar" />
        </section>

        <section
          className={cn(
            'flex flex-1 flex-col min-h-0 min-w-0 pt-0.5 overflow-hidden',
            SIDEBAR_OUTER_GAP,
            SIDEBAR_GAP_SEPARATOR
          )}
          aria-label="Chat history"
        >
          <ChatHistorySection
            historyScrollRef={historyScrollRef}
            collapsedGroups={collapsedGroups}
            setCollapsedGroups={setCollapsedGroups}
            onCollapseAll={collapseAllGroups}
            hideScrollbar={hideScrollbar}
            threadsFilter={(t) => t.groupId == null || t.groupId === ''}
            ungroupedSectionTitle="threadHistory.sidebar.ungroupedChat"
            hasUncollapsedRecentGroups={hasUncollapsedRecentGroups}
          />
        </section>
      </div>
    </Sidebar>
  );
}
