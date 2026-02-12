import { atom, RecoilState } from 'recoil';

export const sidebarTopicsSectionExpandedState: RecoilState<boolean> = atom<
  boolean
>({
  key: 'sidebarTopicsSectionExpanded',
  default: false
});

export const sidebarRecentSectionExpandedState: RecoilState<boolean> = atom<
  boolean
>({
  key: 'sidebarRecentSectionExpanded',
  default: true
});

export const sidebarRecentTimeGroupCollapsedState: RecoilState<
  Set<string> | null
> = atom<Set<string> | null>({
  key: 'sidebarRecentTimeGroupCollapsed',
  default: null
});

export const sidebarTopicGroupExpandedState: RecoilState<Set<string>> = atom<
  Set<string>
>({
  key: 'sidebarTopicGroupExpanded',
  default: new Set()
});

export type GroupTimeGroupCollapsedState = Record<string, Set<string> | null>;

export const sidebarGroupTimeGroupCollapsedState: RecoilState<GroupTimeGroupCollapsedState> =
  atom<GroupTimeGroupCollapsedState>({
    key: 'sidebarGroupTimeGroupCollapsed',
    default: {}
  });
