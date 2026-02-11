import { useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  ChainlitContext,
  groupByDate,
  threadGroupsState,
  threadHistoryState,
  useConfig
} from '@chainlit/react-client';

import { Logo } from '@/components/Logo';
import SidebarTrigger from '@/components/header/SidebarTrigger';
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar';

import NewChatButton from '../header/NewChat';
import SearchChats from './Search';
import { GroupedChatSection } from './GroupedChatSection';
import { useThreadCollapseState } from './ThreadCollapse';
import { ThreadHistory } from './ThreadHistory';
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
        (t) => t.groupId == null || t.groupId === ''
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

  const {
    collapsedGroups,
    setCollapsedGroups,
    effectiveCollapsed,
    collapseAllGroups,
    showButton
  } = useThreadCollapseState(sortedTimeGroupKeys);

  const allGroupsCollapsed =
    sortedTimeGroupKeys.length > 0 &&
    effectiveCollapsed.size === sortedTimeGroupKeys.length;

  useEffect(() => {
    if (!dataPersistence || !apiClient?.listThreadGroups) return;
    apiClient
      .listThreadGroups()
      .then(setThreadGroups)
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
          className="flex flex-1 flex-col min-h-0 border-t border-sidebar-border/60 pt-4 gap-4 overflow-hidden"
          aria-label="Chat history"
        >
          <GroupedChatSection />
          <div className="flex flex-1 flex-col min-h-0">
            <ThreadHistory
              collapsedGroups={collapsedGroups}
              setCollapsedGroups={setCollapsedGroups}
              hideScrollbar={allGroupsCollapsed}
              showCollapseButton={showButton}
              onCollapseAll={collapseAllGroups}
              threadsFilter={(t) => t.groupId == null || t.groupId === ''}
              sectionTitle="threadHistory.sidebar.ungroupedChat"
            />
          </div>
        </section>
      </div>
    </Sidebar>
  );
}
