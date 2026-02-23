import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Loader } from '@/components/Loader';
import { Button } from '@/components/ui/button';

import {
  SIDEBAR_MAJOR_SECTION_HEADER,
  SIDEBAR_MAJOR_SECTION_HEADER_DEFAULT,
  SIDEBAR_MAJOR_SECTION_HEADER_HOVER,
  SIDEBAR_MAJOR_SECTION_HEADER_SMALL_LABEL,
  SIDEBAR_SECTION_HEADER_SELECTED_IN_WRAPPER,
  SIDEBAR_SECTION_HEADER_SELECTED_STICKY,
  SIDEBAR_SECTION_HEADER_TO_CONTENT_GAP,
  SIDEBAR_SECTION_WRAPPER_SELECTED,
  SIDEBAR_SECTION_LEFT_BAR_PADDING,
  SIDEBAR_STICKY_SECTION_HEADER_BG,
  SIDEBAR_GROUP_SECTION_BG_TOPICS,
  SIDEBAR_GROUP_SECTION_BG_RECENT
} from './layout';

export type SidebarSectionBackgroundVariant = 'topics' | 'recent' | 'none';

/** Topics = borderless muted header; Recent = small text label only (NBC). */
export type SidebarSectionHeaderVariant = 'default' | 'smallLabel';

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
  /** Full-section background when expanded (covers entire group for visual distinction). */
  sectionBackground?: SidebarSectionBackgroundVariant;
  /** default = Topics (muted); smallLabel = Recent (small text label only). */
  headerVariant?: SidebarSectionHeaderVariant;
}

/**
 * Collapsible section: header toggles expand/collapse. When it contains the
 * current thread, a subtle left accent and tint indicate "you are here".
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
  stickyHeader = false,
  sectionBackground = 'none',
  headerVariant = 'default'
}: SidebarSectionProps) {
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggle();
  };

  const hasSectionBg =
    sectionBackground !== 'none' && expanded;
  const sectionBgClass =
    sectionBackground === 'topics'
      ? SIDEBAR_GROUP_SECTION_BG_TOPICS
      : sectionBackground === 'recent'
        ? SIDEBAR_GROUP_SECTION_BG_RECENT
        : '';

  const isSmallLabel = headerVariant === 'smallLabel';

  const sectionContent = (
    <>
      <Button
        onClick={handleToggleClick}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          if (e.button === 0) e.preventDefault();
        }}
        variant="ghost"
        size="default"
        className={cn(
          SIDEBAR_MAJOR_SECTION_HEADER,
          isSmallLabel && 'h-9 min-h-9 text-[12px]',
          isSmallLabel && SIDEBAR_MAJOR_SECTION_HEADER_SMALL_LABEL,
          stickyHeader && cn('sticky top-0 z-20', SIDEBAR_STICKY_SECTION_HEADER_BG),
          containsSelected && (stickyHeader ? SIDEBAR_SECTION_HEADER_SELECTED_STICKY : SIDEBAR_SECTION_HEADER_SELECTED_IN_WRAPPER),
          !containsSelected && !isSmallLabel && SIDEBAR_MAJOR_SECTION_HEADER_DEFAULT,
          !containsSelected && !isSmallLabel && SIDEBAR_MAJOR_SECTION_HEADER_HOVER,
          !containsSelected && isSmallLabel && 'hover:bg-sidebar-foreground/[0.04] dark:hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground/80'
        )}
        aria-expanded={expanded}
      >
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {rightSlot != null ? (
            rightSlot
          ) : isLoading ? (
            <Loader />
          ) : expanded ? (
            <ChevronDown className={cn('size-4 transition-opacity duration-200', isSmallLabel ? 'text-sidebar-foreground/45' : 'text-sidebar-foreground/50')} />
          ) : (
            <ChevronRight className={cn('size-4 transition-opacity duration-200', isSmallLabel ? 'text-sidebar-foreground/45' : 'text-sidebar-foreground/50')} />
          )}
        </div>
      </Button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out min-h-0 min-w-0 overflow-clip',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
        aria-hidden={!expanded}
      >
        <div
          className={cn(
            'min-h-0 min-w-0 overflow-clip',
            SIDEBAR_SECTION_LEFT_BAR_PADDING
          )}
        >
          {children}
        </div>
      </div>
    </>
  );

  return (
    <section
      className={cn(
        'flex min-w-0 shrink-0 flex-col',
        expanded ? SIDEBAR_SECTION_HEADER_TO_CONTENT_GAP : 'gap-0',
        containsSelected && SIDEBAR_SECTION_WRAPPER_SELECTED,
        hasSectionBg && sectionBgClass
      )}
      aria-label={ariaLabel}
      aria-current={containsSelected ? 'true' : undefined}
    >
      {sectionContent}
    </section>
  );
}
