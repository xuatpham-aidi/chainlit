import { cn, hasMessage } from '@/lib/utils';
import {
  MutableRefObject,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  ChainlitContext,
  FileSpec,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import { Logo } from '@/components/Logo';
import { Markdown } from '@/components/Markdown';

import MessageComposer from './MessageComposer';
import Starters from './Starters';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  autoScrollRef: MutableRefObject<boolean>;
}

export default function WelcomeScreen(props: Props) {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { chatProfile } = useChatSession();
  const { messages } = useChatMessages();
  const [isVisible, setIsVisible] = useState(false);

  const chatProfiles = config?.chatProfiles;

  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const welcomeMessage = useMemo(() => {
    if (chatProfile && chatProfiles) {
      const currentChatProfile = chatProfiles.find(
        (cp) => cp.name === chatProfile
      );
      return (
        <div className="flex flex-col gap-2 mb-12 items-center select-none pointer-events-none max-w-lg text-center">
          {currentChatProfile?.markdown_description ? (
            <Markdown
              allowHtml={allowHtml}
              latex={latex}
              className="welcome-markdown"
            >
              {currentChatProfile.markdown_description}
            </Markdown>
          ) : null}
        </div>
      );
    }
  }, [chatProfiles, chatProfile, apiClient, allowHtml, latex]);

  if (hasMessage(messages)) return null;

  return (
    <div
      id="welcome-screen"
      className={cn(
        'flex flex-col -mt-[60px] gap-6 w-full flex-grow items-center justify-center welcome-screen mx-auto transition-opacity duration-500 ease-out opacity-0 delay-100',
        isVisible && 'opacity-100'
      )}
    >
      {welcomeMessage}
      <MessageComposer {...props} />
      <Starters />
    </div>
  );
}
