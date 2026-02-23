import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Loader } from '@/components/Loader';
import { Button } from '@/components/ui/button';

import {
  SIDEBAR_SECTION_HEADER,
  SIDEBAR_SECTION_HEADER_SELECTED,
  SIDEBAR_SECTION_HEADER_HOVER,
  SIDEBAR_SECTION_GAP
} from './layout';

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
      className={cn('shrink-0 flex flex-col', SIDEBAR_SECTION_GAP)}
      aria-label={ariaLabel}
    >
      <Button
        onClick={onToggle}
        variant="ghost"
        size="default"
        className={cn(
          SIDEBAR_SECTION_HEADER,
          stickyHeader && 'sticky top-0 z-20 !bg-sidebar',
          containsSelected && SIDEBAR_SECTION_HEADER_SELECTED,
          containsSelected && 'hover:bg-sidebar-foreground/15 text-sidebar-foreground',
          !containsSelected && 'text-sidebar-foreground/70 hover:text-sidebar-foreground',
          !containsSelected && SIDEBAR_SECTION_HEADER_HOVER
        )}
        aria-expanded={expanded}
      >
        <span className="min-w-0 flex-1 truncate text-left text-xs font-medium tracking-tight">
          {title}
        </span>
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
