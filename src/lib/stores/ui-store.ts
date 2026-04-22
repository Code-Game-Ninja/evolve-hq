import { create } from 'zustand';

interface UIState {
  isNotificationSidebarOpen: boolean;
  setNotificationSidebarOpen: (open: boolean) => void;
  toggleNotificationSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNotificationSidebarOpen: false,
  setNotificationSidebarOpen: (open) => set({ isNotificationSidebarOpen: open }),
  toggleNotificationSidebar: () => set((state) => ({ isNotificationSidebarOpen: !state.isNotificationSidebarOpen })),
}));
