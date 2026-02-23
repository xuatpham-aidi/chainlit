import { CopyMinus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';
import { SIDEBAR_ICON_BUTTON } from './layout';

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
  /** Align icon to 'end' (right) to line up with Search/NewChat icons in the sidebar. */
  alignIcon?: 'center' | 'end';
}

/**
 * Icon button: collapse all thread groups. Renders nothing when not visible.
 * When disabled, shows the same icon but non-clickable and without pointer cursor.
 */
export function ThreadCollapseButton({
  visible,
  onCollapseAll,
  disabled = false,
  alignIcon = 'center'
}: ThreadCollapseButtonProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  const iconClasses = cn(SIDEBAR_ICON_BUTTON, 'cursor-pointer');

  if (disabled) {
    return (
      <span
        className={cn(
          iconClasses,
          'cursor-default opacity-50 hover:bg-transparent',
          alignIcon === 'end' && 'justify-end w-4 h-4'
        )}
        aria-hidden
        onPointerDown={(e) => e.stopPropagation()}
      >
        <CopyMinus className="size-4" />
      </span>
    );
  }

  const tooltipText = t('threadHistory.sidebar.collapseAll', 'Collapse all');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onCollapseAll();
  };

  const isEndAligned = alignIcon === 'end';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          onPointerDown={(e) => e.stopPropagation()}
          size="icon"
          variant="ghost"
          className={cn(
            SIDEBAR_ICON_BUTTON,
            'shrink-0',
            isEndAligned
              ? 'h-4 w-4 justify-center rounded-xl'
              : 'h-9 w-9'
          )}
        >
          <CopyMinus className="size-4 shrink-0" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="rounded-2xl">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

