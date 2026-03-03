import React, { useState } from 'react';
import { useResetRecoilState } from 'recoil';

import { useChatInteract, useConfig } from '@chainlit/react-client';

import { Translator } from '@/components/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

import { chatInputDraftState } from '@/state/chat';
import { EditSquare } from '../icons/EditSquare';

type NewChatDialogProps = {
  open: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
};

export const NewChatDialog = ({
  open,
  handleClose,
  handleConfirm
}: NewChatDialogProps) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (event.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        id="new-chat-dialog"
        className="sm:max-w-md"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>
            <Translator path="navigation.newChat.dialog.title" />
          </DialogTitle>
          <DialogDescription>
            <Translator path="navigation.newChat.dialog.description" />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            <Translator path="common.actions.cancel" />
          </Button>
          <Button variant="default" onClick={handleConfirm} id="confirm">
            <Translator path="common.actions.confirm" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  navigate?: (to: string) => void;
  onConfirm?: () => void;
  showLabel?: boolean;
}

const NewChatButton = ({
  navigate,
  onConfirm,
  showLabel = false,
  className,
  ...buttonProps
}: Props) => {
  const [open, setOpen] = useState(false);
  const { clear } = useChatInteract();
  const resetChatInputDraft = useResetRecoilState(chatInputDraftState);
  const { config } = useConfig();

  const handleClickOpen = () => {
    if (config?.ui?.confirm_new_chat === false) {
      handleConfirm();
    } else {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      clear();
      resetChatInputDraft();
      navigate?.('/');
    }
    handleClose();
  };

  const button = (
    <Button
      variant="ghost"
      size={showLabel ? 'default' : 'icon'}
      id="new-chat-button"
      className={cn(
        !showLabel &&
        'h-8 w-8 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors duration-150',
        className
      )}
      onClick={handleClickOpen}
      {...buttonProps}
    >
      {showLabel ? (
        <>
          <span className="min-w-0 flex-1 truncate text-left">
            <Translator path="navigation.newChat.button" />
          </span>
          <EditSquare className="size-4 shrink-0" />
        </>
      ) : (
        <EditSquare className="size-5" />
      )}
    </Button>
  );

  return (
    <div>
      <TooltipProvider>
        {showLabel ? (
          button
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>
              <Translator path="navigation.newChat.dialog.tooltip" />
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
      <NewChatDialog
        open={open}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
      />
    </div>
  );
};

export default NewChatButton;
