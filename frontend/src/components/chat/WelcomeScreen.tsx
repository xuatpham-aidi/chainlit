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

  const logo = useMemo(() => {
    if (chatProfile && chatProfiles) {
      const currentChatProfile = chatProfiles.find(
        (cp) => cp.name === chatProfile
      );
      if (currentChatProfile?.icon) {
        const iconSrc = currentChatProfile?.icon.startsWith('/public')
          ? apiClient.buildEndpoint(currentChatProfile?.icon)
          : currentChatProfile?.icon;

        return (
          <div className="flex flex-col gap-2 mb-12 items-center select-none pointer-events-none">
            {/* Single hidden image element - ensures image loads once and is cached */}
            <img
              src={iconSrc}
              alt=""
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                opacity: 0,
                pointerEvents: 'none',
                visibility: 'hidden'
              }}
            />
            <div
              className="cube-container relative h-16 w-16"
              style={{ '--cube-texture': `url("${iconSrc}")` } as React.CSSProperties}
            >
              <div className="cube-3d relative w-full h-full">
                {/* Front face */}
                <div
                  className="cube-face border-2 border-purple-500/40 rounded-lg shadow-2xl backdrop-blur-sm"
                  style={{
                    transform: 'translate3d(0, 0, 32px)',
                    backgroundImage: 'var(--cube-texture)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.1)'
                  }}
                />
                {/* Back face */}
                <div
                  className="cube-face border-2 border-purple-500/40 rounded-lg shadow-2xl backdrop-blur-sm"
                  style={{
                    transform: 'translate3d(0, 0, -32px) rotateY(180deg)',
                    backgroundImage: 'var(--cube-texture)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.1)'
                  }}
                />
                {/* Right face */}
                <div
                  className="cube-face border-2 border-purple-500/40 rounded-lg shadow-2xl backdrop-blur-sm"
                  style={{
                    transform: 'rotateY(90deg) translate3d(0, 0, 32px)',
                    backgroundImage: 'var(--cube-texture)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.85,
                    boxShadow: '0 0 15px rgba(168, 85, 247, 0.25), inset 0 0 15px rgba(168, 85, 247, 0.08)'
                  }}
                />
                {/* Left face */}
                <div
                  className="cube-face border-2 border-purple-500/40 rounded-lg shadow-2xl backdrop-blur-sm"
                  style={{
                    transform: 'rotateY(-90deg) translate3d(0, 0, 32px)',
                    backgroundImage: 'var(--cube-texture)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.85,
                    boxShadow: '0 0 15px rgba(168, 85, 247, 0.25), inset 0 0 15px rgba(168, 85, 247, 0.08)'
                  }}
                />
                {/* Top face */}
                <div
                  className="cube-face border-2 border-purple-500/40 rounded-lg shadow-2xl backdrop-blur-sm"
                  style={{
                    transform: 'rotateX(90deg) translate3d(0, 0, 32px)',
                    backgroundImage: 'var(--cube-texture)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.75,
                    boxShadow: '0 0 15px rgba(168, 85, 247, 0.25), inset 0 0 15px rgba(168, 85, 247, 0.08)'
                  }}
                />
                {/* Bottom face */}
                <div
                  className="cube-face border-2 border-purple-500/40 rounded-lg shadow-2xl backdrop-blur-sm"
                  style={{
                    transform: 'rotateX(-90deg) translate3d(0, 0, 32px)',
                    backgroundImage: 'var(--cube-texture)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.75,
                    boxShadow: '0 0 15px rgba(168, 85, 247, 0.25), inset 0 0 15px rgba(168, 85, 247, 0.08)'
                  }}
                />
              </div>
            </div>
            {currentChatProfile?.markdown_description ? (
              <Markdown allowHtml={allowHtml} latex={latex}>
                {currentChatProfile.markdown_description}
              </Markdown>
            ) : null}
          </div>
        );
      }
    }

    return <Logo className="w-[200px] mb-2" />;
  }, [chatProfiles, chatProfile, apiClient, allowHtml, latex]);

  if (hasMessage(messages)) return null;

  return (
    <div
      id="welcome-screen"
      className={cn(
        'flex flex-col -mt-[60px] gap-4 w-full flex-grow items-center justify-center welcome-screen mx-auto transition-opacity duration-500 opacity-0 delay-100',
        isVisible && 'opacity-100'
      )}
    >
      {logo}
      <MessageComposer {...props} />
      <Starters />
    </div>
  );
}
