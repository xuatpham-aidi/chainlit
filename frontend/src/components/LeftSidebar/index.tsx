import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { threadHistoryState } from '@chainlit/react-client';

import SidebarTrigger from '@/components/header/SidebarTrigger';
import {
  Sidebar,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar';

import NewChatButton from '../header/NewChat';
import SearchChats from './Search';
import { ThreadCollapseButton, useThreadCollapseState } from './ThreadCollapse';
import { ThreadHistory } from './ThreadHistory';
import { getSortedTimeGroupKeys } from './ThreadList';

export default function LeftSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const threadHistory = useRecoilValue(threadHistoryState);
  const sortedTimeGroupKeys = useMemo(
    () => getSortedTimeGroupKeys(threadHistory?.timeGroupedThreads),
    [threadHistory?.timeGroupedThreads]
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

  return (
    <Sidebar {...props} className="border-none bg-sidebar">
      <SidebarHeader className="sidebar-header-nbc border-b border-sidebar-border/80 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <SidebarTrigger />
          <div className="flex items-center gap-0.5 rounded-md bg-sidebar-accent/30 p-0.5">
            <ThreadCollapseButton
              visible={showButton}
              onCollapseAll={collapseAllGroups}
            />
            <SearchChats />
            <NewChatButton navigate={navigate} />
          </div>
        </div>
      </SidebarHeader>
      <ThreadHistory
        collapsedGroups={collapsedGroups}
        setCollapsedGroups={setCollapsedGroups}
        hideScrollbar={allGroupsCollapsed}
      />
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
