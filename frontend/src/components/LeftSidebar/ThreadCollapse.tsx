import { CopyMinus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

const STORAGE_KEY = 'chainlit:thread-history-collapsed-groups';

function loadFromStorage(): Set<string> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return null;
  }
}

function saveToStorage(collapsed: Set<string>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(collapsed)));
  } catch {
    // ignore
  }
}

export interface ThreadCollapseState {
  collapsedGroups: Set<string> | null;
  setCollapsedGroups: React.Dispatch<
    React.SetStateAction<Set<string> | null>
  >;
  effectiveCollapsed: Set<string>;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  showButton: boolean;
}

/**
 * Hook that owns thread list collapse state: which time groups (Today, Yesterday, etc.)
 * are collapsed. Persists to sessionStorage and defaults to "all collapsed" when
 * there is no saved state.
 */
export function useThreadCollapseState(
  sortedTimeGroupKeys: string[]
): ThreadCollapseState {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string> | null>(
    loadFromStorage
  );

  useEffect(() => {
    const hasNoSavedState = collapsedGroups === null;
    const hasGroups = sortedTimeGroupKeys.length > 0;
    if (hasNoSavedState && hasGroups) {
      const allCollapsed = new Set(sortedTimeGroupKeys);
      setCollapsedGroups(allCollapsed);
      saveToStorage(allCollapsed);
    }
  }, [collapsedGroups, sortedTimeGroupKeys]);

  const effectiveCollapsed = useMemo(
    () =>
      collapsedGroups === null
        ? new Set(sortedTimeGroupKeys)
        : collapsedGroups,
    [collapsedGroups, sortedTimeGroupKeys]
  );

  const expandAllGroups = useCallback(() => {
    setCollapsedGroups(() => {
      const next = new Set<string>();
      saveToStorage(next);
      return next;
    });
  }, []);

  const collapseAllGroups = useCallback(() => {
    setCollapsedGroups(() => {
      const next = new Set(sortedTimeGroupKeys);
      saveToStorage(next);
      return next;
    });
  }, [sortedTimeGroupKeys]);

  const showButton = sortedTimeGroupKeys.length > 1;

  return {
    collapsedGroups,
    setCollapsedGroups,
    effectiveCollapsed,
    expandAllGroups,
    collapseAllGroups,
    showButton
  };
}

export interface ThreadCollapseButtonProps {
  visible: boolean;
  isAllExpanded: boolean;
  onToggle: () => void;
}

/**
 * Icon button that toggles between "expand all" and "collapse all" thread groups.
 * Tooltip shows the action that will happen on click. Renders nothing when not visible.
 */
export function ThreadCollapseButton({
  visible,
  isAllExpanded,
  onToggle
}: ThreadCollapseButtonProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  const labelExpand = t('threadHistory.sidebar.expandAll', 'Expand all');
  const labelCollapse = t('threadHistory.sidebar.collapseAll', 'Collapse all');
  const tooltipText = isAllExpanded ? labelCollapse : labelExpand;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onToggle}
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-muted-foreground"
        >
          <CopyMinus className="!size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="flex flex-col items-center">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

export { loadFromStorage as loadCollapsedGroups };
export { saveToStorage as saveCollapsedGroups };
export { STORAGE_KEY as COLLAPSED_GROUPS_KEY };
