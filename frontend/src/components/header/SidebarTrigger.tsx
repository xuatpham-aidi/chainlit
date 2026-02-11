import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

import { Sidebar } from '../icons/Sidebar';
import { useSidebar } from '../ui/sidebar';

export default function SidebarTrigger() {
  const { setOpen, open, openMobile, setOpenMobile, isMobile } = useSidebar();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="sidebar-trigger-button"
            onClick={() =>
              isMobile ? setOpenMobile(!openMobile) : setOpen(!open)
            }
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors duration-150"
          >
            <Sidebar className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {open ? (
              <Translator path="threadHistory.sidebar.actions.close" />
            ) : (
              <Translator path="threadHistory.sidebar.actions.open" />
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
