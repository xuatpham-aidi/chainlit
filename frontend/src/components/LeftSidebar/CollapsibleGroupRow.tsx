import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface CollapsibleGroupRowProps {
  label: React.ReactNode;
  count?: number;
  isCollapsed: boolean;
  onToggle?: () => void;
  containsSelected?: boolean;
  className?: string;
  asButton?: boolean;
  contentOnly?: boolean;
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
  contentOnly = false
}: CollapsibleGroupRowProps) {
  const content = (
    <>
      {isCollapsed ? (
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'text-sm font-normal rounded-full px-1.5 text-center',
            containsSelected
              ? 'bg-neutral-600/20 font-medium'
              : 'text-sidebar-foreground/45 bg-sidebar-foreground/10'
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
    !contentOnly && 'bg-neutral-300/20',
    'transition-colors duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
    !contentOnly &&
    (containsSelected
      ? 'bg-neutral-600/30 text-sidebar-foreground'
      : 'hover:bg-neutral-300/50 hover:text-sidebar-foreground/90'),
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
        className={cn(rowClassName, 'hover:scale-105')}
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
