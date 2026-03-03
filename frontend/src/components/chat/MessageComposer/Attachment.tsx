import React from 'react';
import { DefaultExtensionType, FileIcon, defaultStyles } from 'react-file-icon';

import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface AttachmentProps {
  name: string;
  mime: string;
  children?: React.ReactNode;
}

const Attachment: React.FC<AttachmentProps> = ({ name, mime, children }) => {
  let extension: DefaultExtensionType;
  if (name.includes('.')) {
    extension = name.split('.').pop()!.toLowerCase() as DefaultExtensionType;
  } else {
    extension = mime
      ? ((mime.split('/').pop() || 'txt') as DefaultExtensionType)
      : ('txt' as DefaultExtensionType);
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative h-[40px]">
            {children}
            <Card className="h-full px-2 py-1 flex flex-row items-center gap-2 rounded-md w-full max-w-[180px] border">
              <div className="w-6">
                <FileIcon {...defaultStyles[extension]} extension={extension} />
              </div>
              <span className="truncate w-[80%] text-xs font-medium">
                {name}
              </span>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { Attachment };
