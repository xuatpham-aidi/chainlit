import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';

export interface CollapsibleGroupRowProps {
  label: React.ReactNode;
  count?: number;
  isCollapsed: boolean;
  onToggle?: () => void;
  containsSelected?: boolean;
  className?: string;
  asButton?: boolean;
  contentOnly?: boolean;
  /** When false, show folder icon instead of chevron (e.g. empty group with no threads). */
  showChevron?: boolean;
}

/**
 * Shared row for collapsible groups: chevron, label, optional count.
 * Same behaviour and a11y for time groups (ThreadList) and topic groups (GroupedChatSection).
 */
export function CollapsibleGroupRow({
  label,
  count,
  isCollapsed,
  onToggle,
  containsSelected = false,
  className,
  asButton = true,
  contentOnly = false,
  showChevron = true
}: CollapsibleGroupRowProps) {
  const leadingIcon = showChevron ? (
    isCollapsed ? (
      <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
    )
  ) : (
    <Folder className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" aria-hidden />
  );
  const content = (
    <>
      {leadingIcon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'text-sm font-normal rounded-full px-1.5 text-center',
            containsSelected
              ? 'bg-sidebar-foreground/15 font-medium text-sidebar-foreground/90'
              : 'text-sidebar-foreground/50 bg-sidebar-foreground/10'
          )}
        >
          {count}
        </span>
      )}
    </>
  );

  const rowClassName = cn(
    'flex w-full items-center gap-2 rounded-lg py-1.5 pl-2 pr-2',
    'text-xs font-medium tracking-tight',
    !contentOnly && 'bg-sidebar-foreground/5',
    'transition-colors duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
    !contentOnly && containsSelected && 'bg-sidebar-foreground/10 text-sidebar-foreground',
    !contentOnly && !containsSelected && 'hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground/90',
    className
  );

  if (contentOnly) {
    return <div className={cn('flex flex-1 min-w-0 items-center gap-2 py-1.5 pl-2.5 pr-2 text-left rounded-none pointer-events-none select-none text-xs font-medium tracking-tight', className)}>{content}</div>;
  }

  if (asButton) {
    return (
      <button
        type="button"
        onClick={onToggle!}
        className={rowClassName}
        aria-expanded={!isCollapsed}
        data-active={containsSelected || undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle!}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle!();
        }
      }}
      className={rowClassName}
      aria-expanded={!isCollapsed}
      data-active={containsSelected || undefined}
    >
      {content}
    </div>
  );
}
