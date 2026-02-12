import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Loader } from '@/components/Loader';
import { Button } from '@/components/ui/button';

export interface SidebarSectionProps {
  title: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  containsSelected?: boolean;
  isLoading?: boolean;
  rightSlot?: React.ReactNode;
  ariaLabel?: string;
  /** When true, section header sticks at top while scrolling (for use inside scroll container). */
  stickyHeader?: boolean;
}

/**
 * Unified collapsible section: header (title + chevron + optional right slot)
 * toggles section open/closed; same behaviour for group-chat and recent-chat.
 */
export function SidebarSection({
  title,
  expanded,
  onToggle,
  children,
  containsSelected = false,
  isLoading = false,
  rightSlot,
  ariaLabel = 'Section',
  stickyHeader = false
}: SidebarSectionProps) {
  return (
    <section
      className="shrink-0 flex flex-col gap-2"
      aria-label={ariaLabel}
    >
      <Button
        onClick={onToggle}
        variant="ghost"
        size="default"
        className={cn(
          'w-full justify-between gap-2 rounded-lg h-9 px-3 border border-sidebar-border/60 transition-colors duration-150',
          stickyHeader && 'sticky top-0 z-20 !bg-sidebar',
          containsSelected
            ? 'text-sidebar-foreground'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground',
          containsSelected
            ? stickyHeader
              ? '!bg-sidebar-accent hover:!bg-sidebar-accent'
              : 'bg-neutral-600/30 hover:bg-neutral-600/40'
            : stickyHeader
              ? 'hover:!bg-sidebar-accent'
              : 'hover:bg-sidebar-accent/80'
        )}
        aria-expanded={expanded}
      >
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        <div className="flex items-center gap-1 shrink-0">
          {rightSlot != null ? (
            rightSlot
          ) : isLoading ? (
            <Loader />
          ) : expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </div>
      </Button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out min-h-0 overflow-clip',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
        aria-hidden={!expanded}
      >
        <div className="min-h-0 overflow-clip">{children}</div>
      </div>
    </section>
  );
}
