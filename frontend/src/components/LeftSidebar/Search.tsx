import _ from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import { ChainlitContext, IThread, threadHistoryState } from '@chainlit/react-client';

import { Loader } from '@/components/Loader';
import { Search } from '@/components/icons/Search';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { DialogTitle } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

import { SIDEBAR_ACTION_SECONDARY } from './layout';
import { Kbd } from '../Kbd';

interface SearchChatsProps {
  triggerVariant?: 'icon' | 'bar';
}

export default function SearchChats({
  triggerVariant = 'icon'
}: SearchChatsProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<IThread[]>([]);
  const [loading, setLoading] = useState(false);

  const apiClient = useContext(ChainlitContext);
  const setThreadHistory = useSetRecoilState(threadHistoryState);

  // Search hits backend list_threads with filters.search (DB-side filter on step content). Results are independent of sidebar list.
  const debouncedSearch = useMemo(
    () =>
      _.debounce(async (query: string) => {
        setLoading(true);
        try {
          const { data } = await apiClient.listThreads(
            { first: 20, cursor: undefined },
            { search: query || undefined }
          );
          setThreads(data || []);
        } catch (error) {
          toast.error('Error fetching threads: ' + error);
        } finally {
          setLoading(false);
        }
      }, 300),
    [apiClient]
  );

  // Group threads by month and year
  const groupedThreads = useMemo(() => {
    return _.groupBy(threads, (thread) => {
      const date = new Date(thread.createdAt);
      return `${date.toLocaleString(navigator.language, {
        month: 'long'
      })} ${date.getFullYear()}`;
    });
  }, [threads]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleSearchTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen((open) => !open);
  };

  const handleSearchPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const trigger =
    triggerVariant === 'bar' ? (
      <Button
        id="search-chats-button"
        onClick={handleSearchTriggerClick}
        onPointerDown={handleSearchPointerDown}
        variant="ghost"
        size="default"
        className={SIDEBAR_ACTION_SECONDARY}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {t('threadHistory.sidebar.filters.placeholder')}
        </span>
        <Search className="size-4 shrink-0 opacity-75 transition-opacity duration-200" />
      </Button>
    ) : (
      <Button
        id="search-chats-button"
        onClick={handleSearchTriggerClick}
        onPointerDown={handleSearchPointerDown}
        size="icon"
        variant="ghost"
        className="h-9 w-9 rounded-xl text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.08] transition-colors duration-200 ease-in-out"
      >
        <Search className="size-4" />
      </Button>
    );

  return (
    <>
      <TooltipProvider>
        {triggerVariant === 'bar' ? (
          trigger
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col items-center">
                <Translator path="threadHistory.sidebar.filters.search" />
                <Kbd>Cmd+k</Kbd>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">
          {t('threadHistory.sidebar.filters.search')}
        </DialogTitle>
        <CommandInput
          placeholder={t('threadHistory.sidebar.filters.placeholder')}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList className="h-[300px] overflow-y-auto">
          {loading ? (
            <CommandEmpty className="p-4 flex items-center justify-center">
              <Loader />
            </CommandEmpty>
          ) : Object.keys(groupedThreads).length === 0 ? (
            <CommandEmpty>
              <Translator path="threadHistory.sidebar.empty" />
            </CommandEmpty>
          ) : (
            Object.entries(groupedThreads).map(([monthYear, monthThreads]) => (
              <CommandGroup
                key={`${searchQuery}-${monthYear}`}
                heading={monthYear}
              >
                {monthThreads.map((thread) => (
                  <CommandItem
                    className="cursor-pointer"
                    key={`${searchQuery}-${thread.id}`}
                    value={`${searchQuery}-${thread.id}`}
                    onSelect={() => {
                      setOpen(false);
                      setThreadHistory((prev) => ({
                        ...prev,
                        threads: _.uniqBy(
                          [thread, ...(prev?.threads ?? [])],
                          'id'
                        )
                      }));
                      navigate(`/thread/${thread.id}`);
                    }}
                  >
                    <div className="line-clamp-2">
                      {thread.name || 'Untitled Conversation'}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
