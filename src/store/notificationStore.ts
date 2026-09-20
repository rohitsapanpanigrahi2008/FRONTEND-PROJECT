import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  createdAt: number;
}

interface NotificationState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: string) => void;
}

const MAX_TOASTS = 4;
const TOAST_TTL_MS = 6000;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const toast: Toast = { id: crypto.randomUUID(), kind, message, createdAt: Date.now() };
    set({ toasts: [...get().toasts.slice(-(MAX_TOASTS - 1)), toast] });
    setTimeout(() => get().dismiss(toast.id), TOAST_TTL_MS);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
