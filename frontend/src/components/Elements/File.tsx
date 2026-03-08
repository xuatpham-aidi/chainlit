import { type IFileElement } from '@chainlit/react-client';

import { Attachment } from '@/components/chat/MessageComposer/Attachment';

import { SQLFileElement } from './SQLFileElement';
import { XLSXFileElement } from './XLSXFileElement';

type FileElementWithContent = IFileElement & { content?: string };

export const isSQLFile = (name: string) => name.toLowerCase().endsWith('sql');

export const isXLSXFile = (name: string) => {
  const lower = name.toLowerCase();
  return lower.endsWith('.xlsx') || lower.endsWith('.xls');
};

const FileElement = ({ element }: { element: IFileElement }) => {
  if (!element.url && !(element as FileElementWithContent).content) {
    return null;
  }

  if (isSQLFile(element.name)) {
    return <SQLFileElement element={element} />;
  }

  if (isXLSXFile(element.name)) {
    return <XLSXFileElement element={element} />;
  }

  if (!element.url) {
    return null;
  }

  return (
    <a
      className={`${element.display}-file no-underline`}
      download={element.name}
      href={element.url}
    >
      <Attachment name={element.name} mime={element.mime!} />
    </a>
  );
};

export { FileElement };
