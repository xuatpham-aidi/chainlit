import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { threadHistoryState } from '@chainlit/react-client';

import { Logo } from '@/components/Logo';
import SidebarTrigger from '@/components/header/SidebarTrigger';
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar';

import NewChatButton from '../header/NewChat';
import SearchChats from './Search';
import { useThreadCollapseState } from './ThreadCollapse';
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
      <SidebarHeader className="sidebar-header-nbc flex flex-col gap-2 border-b border-sidebar-border/80 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <Logo className="h-8 w-auto max-w-[140px] shrink-0" />
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <div className="flex flex-col gap-2 px-3 pt-5">
        <div className="w-full">
          <NewChatButton
            navigate={navigate}
            showLabel
            className="w-full justify-start gap-2 rounded-lg h-9 px-3 border border-sidebar-border/60 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors duration-150"
          />
        </div>
        <div className="w-full">
          <SearchChats triggerVariant="bar" />
        </div>
        <ThreadHistory
          collapsedGroups={collapsedGroups}
          setCollapsedGroups={setCollapsedGroups}
          hideScrollbar={allGroupsCollapsed}
          showCollapseButton={showButton}
          onCollapseAll={collapseAllGroups}
        />
      </div>
    </Sidebar>
  );
}
