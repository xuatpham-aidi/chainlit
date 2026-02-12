import { cn } from '@/lib/utils';
import { Ellipsis, Share2, Trash2 } from 'lucide-react';

import { Pencil } from '@/components/icons/Pencil';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { Translator } from '../i18n';

interface IThreadGroup {
  id: string;
  userId: string;
  name: string;
  displayOrder: number;
  createdAt?: string;
}

interface Props {
  threadId: string;
  threadGroupId?: string | null;
  threadGroups?: IThreadGroup[];
  onMoveToGroup?: (threadId: string, groupId: string | null) => void | Promise<void>;
  onDelete: () => void;
  onRename: () => void;
  onShare?: () => void;
  onDropdownOpenChange?: (open: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export default function ThreadOptions({
  threadId,
  threadGroupId,
  threadGroups = [],
  onMoveToGroup,
  onDelete,
  onRename,
  onShare,
  onDropdownOpenChange,
  className,
  disabled = false
}: Props) {
  if (disabled) return null;

  const otherGroups = threadGroups.filter((g) => g.id !== threadGroupId);
  const hasGroups = threadGroups.length > 0;
  const isInGroup = Boolean(threadGroupId);

  const handleMoveToGroup = (e: React.MouseEvent, groupId: string | null) => {
    e.stopPropagation();
    onMoveToGroup?.(threadId, groupId);
  };

  return (
    <DropdownMenu onOpenChange={onDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          id="thread-options"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'h-8 w-8 focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors duration-150',
            className
          )}
        >
          <Ellipsis className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[8rem] rounded-xl border-sidebar-border/80 shadow-lg"
        side="right"      // Changed from default (bottom) to right
        align="start"     // Aligns to the start of the trigger
        forceMount
        sideOffset={20}
      >
        <DropdownMenuItem
          id="rename-thread"
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="rounded-lg py-2 cursor-pointer"
        >
          <Translator path="threadHistory.thread.menu.rename" />
          <Pencil className="ml-auto h-4 w-4 opacity-60" />
        </DropdownMenuItem>
        {hasGroups && onMoveToGroup && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="rounded-lg py-2 cursor-pointer-none"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}>
              <Translator path="threadHistory.thread.menu.moveToGroup" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="rounded-xl border-sidebar-border/80" >
              {isInGroup && (
                <DropdownMenuItem
                  className="rounded-lg py-2 cursor-pointer"
                  onClick={(e) => handleMoveToGroup(e, null)}
                >
                  <Translator path="threadHistory.sidebar.ungroupedChat" />
                </DropdownMenuItem>
              )}
              {otherGroups.map((g) => (
                <DropdownMenuItem
                  key={g.id}
                  className="rounded-lg py-2 cursor-pointer"
                  onClick={(e) => handleMoveToGroup(e, g.id)}
                >
                  {g.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {onShare && (
          <DropdownMenuItem
            id="share-thread"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="rounded-lg py-2 cursor-pointer"
          >
            <Translator path="threadHistory.thread.menu.share" />
            <Share2 className="ml-auto h-4 w-4 opacity-60" />
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          id="delete-thread"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-lg py-2 cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <Translator path="threadHistory.thread.menu.delete" />
          <Trash2 className="ml-auto h-4 w-4 opacity-80" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
