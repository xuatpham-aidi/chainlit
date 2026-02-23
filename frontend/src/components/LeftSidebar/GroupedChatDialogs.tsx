/**
 * Dialogs for Grouped chat (Topics): create, rename, delete group.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Translator } from '../i18n';

export interface GroupedChatDialogsProps {
  createDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
  newGroupName: string;
  onNewGroupNameChange: (value: string) => void;
  onCreateGroup: () => void;
  renameGroupId: string | null;
  renameGroupName: string;
  onRenameGroupNameChange: (value: string) => void;
  onRenameGroup: () => void;
  onRenameDialogClose: () => void;
  deleteGroupId: string | null;
  onDeleteGroupIdChange: (id: string | null) => void;
  onDeleteGroup: () => void;
  createGroupPlaceholder?: string;
  renamePlaceholder?: string;
}

export function GroupedChatDialogs({
  createDialogOpen,
  onCreateDialogOpenChange,
  newGroupName,
  onNewGroupNameChange,
  onCreateGroup,
  renameGroupId,
  renameGroupName,
  onRenameGroupNameChange,
  onRenameGroup,
  onRenameDialogClose,
  deleteGroupId,
  onDeleteGroupIdChange,
  onDeleteGroup,
  createGroupPlaceholder,
  renamePlaceholder
}: GroupedChatDialogsProps) {
  return (
    <>
      <Dialog open={createDialogOpen} onOpenChange={onCreateDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Translator path="threadHistory.sidebar.createGroupTitle" />
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newGroupName}
              onChange={(e) => onNewGroupNameChange(e.target.value)}
              placeholder={createGroupPlaceholder}
              onKeyDown={(e) => e.key === 'Enter' && onCreateGroup()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onCreateDialogOpenChange(false)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button onClick={onCreateGroup} disabled={!newGroupName.trim()}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameGroupId} onOpenChange={(open) => !open && onRenameDialogClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Translator path="threadHistory.thread.actions.rename.title" />
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameGroupName}
              onChange={(e) => onRenameGroupNameChange(e.target.value)}
              placeholder={renamePlaceholder}
              onKeyDown={(e) => e.key === 'Enter' && onRenameGroup()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onRenameDialogClose}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button onClick={onRenameGroup} disabled={!renameGroupName.trim()}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteGroupId} onOpenChange={(open) => !open && onDeleteGroupIdChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Translator path="threadHistory.sidebar.deleteGroupTitle" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Translator path="threadHistory.sidebar.deleteGroupDescription" />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Translator path="common.actions.cancel" />
            </AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteGroup}>
              <Translator path="common.actions.confirm" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
