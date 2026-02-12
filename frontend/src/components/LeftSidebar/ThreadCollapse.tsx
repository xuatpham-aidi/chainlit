import { CopyMinus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export interface ThreadCollapseState {
  collapsedGroups: Set<string> | null;
  setCollapsedGroups: React.Dispatch<
    React.SetStateAction<Set<string> | null>
  >;
  effectiveCollapsed: Set<string>;
  collapseAllGroups: () => void;
  showButton: boolean;
}

/**
 * Hook that owns thread list collapse state: which time groups (Today, Yesterday, etc.)
 * are collapsed. Defaults to "all collapsed" when there is no state.
 */
export function useThreadCollapseState(
  sortedTimeGroupKeys: string[]
): ThreadCollapseState {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string> | null>(
    null
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
  }, [sortedTimeGroupKeys]);

  const showButton = sortedTimeGroupKeys.length > 1;

  return {
    collapsedGroups,
    setCollapsedGroups,
    effectiveCollapsed,
    collapseAllGroups,
    showButton
  };
}

export interface ThreadCollapseButtonProps {
  visible: boolean;
  onCollapseAll: () => void;
  disabled?: boolean;
}

/**
 * Icon button: collapse all thread groups. Renders nothing when not visible.
 * When disabled, shows the same icon but non-clickable and without pointer cursor.
 */
export function ThreadCollapseButton({
  visible,
  onCollapseAll,
  disabled = false
}: ThreadCollapseButtonProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  const iconClasses =
    'h-8 w-8 rounded-lg text-sidebar-foreground/70 transition-colors duration-150 flex items-center justify-center';

  if (disabled) {
    return (
      <span
        className={`${iconClasses} cursor-default opacity-50`}
        aria-hidden
      >
        <CopyMinus className="size-4" />
      </span>
    );
  }

  const tooltipText = t('threadHistory.sidebar.collapseAll', 'Collapse all');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onCollapseAll}
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors duration-150"
        >
          <CopyMinus className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="rounded-lg">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

