import { atom, RecoilState } from 'recoil';

export const chatSettingsOpenState: RecoilState<boolean> = atom<boolean>({
  key: 'chatSettingsOpen',
  default: false
});

export const chatSettingsSidebarOpenState: RecoilState<boolean> = atom<boolean>({
  key: 'chatSettingsSidebarOpen',
  default: false
});

export const threadListLoadingState: RecoilState<{
  isFetching: boolean;
  isLoadingMore: boolean;
}> = atom<{
  isFetching: boolean;
  isLoadingMore: boolean;
}>({
  key: 'threadListLoading',
  default: { isFetching: false, isLoadingMore: false }
});
