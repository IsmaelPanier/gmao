import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/services/api";
import { toast } from "sonner";

export interface SyncAction {
  id: string;
  type: "UPDATE_STATUS" | "UPLOAD_MEDIA" | "TIME_LOG";
  payload: any;
  endpoint: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  createdAt: string;
  status: "PENDING" | "SYNCING" | "FAILED";
  retryCount: number;
  error?: string;
}

interface SyncStore {
  actions: SyncAction[];
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  addAction: (action: Omit<SyncAction, "id" | "createdAt" | "status" | "retryCount">) => void;
  removeAction: (id: string) => void;
  clearActions: () => void;
  syncPendingActions: () => Promise<void>;
}

const MAX_RETRIES = 3;

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      actions: [],
      isOnline: navigator.onLine,
      
      setOnlineStatus: (status: boolean) => {
        set({ isOnline: status });
        if (status) {
          get().syncPendingActions();
        }
      },

      addAction: (action) => {
        const newAction: SyncAction = {
          ...action,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          status: "PENDING",
          retryCount: 0,
        };
        
        set((state) => ({ actions: [...state.actions, newAction] }));
        
        if (get().isOnline) {
          get().syncPendingActions();
        } else {
          toast.info("Action sauvegardée hors-ligne. Elle sera synchronisée dès le retour du réseau.");
        }
      },

      removeAction: (id) => {
        set((state) => ({ actions: state.actions.filter((a) => a.id !== id) }));
      },

      clearActions: () => set({ actions: [] }),

      syncPendingActions: async () => {
        const { actions, isOnline, removeAction } = get();
        if (!isOnline) return;

        const pendingActions = actions.filter(
          (a) => (a.status === "PENDING" || a.status === "FAILED") && a.retryCount < MAX_RETRIES
        );
        if (pendingActions.length === 0) return;

        // Mark as syncing
        set((state) => ({
          actions: state.actions.map((a) => 
            pendingActions.some(pa => pa.id === a.id) ? { ...a, status: "SYNCING" } : a
          )
        }));

        let successCount = 0;

        for (const action of pendingActions) {
          try {
            // For file uploads (FormData can't be easily serialized, but we serialize base64 to avoid limits for now, 
            // though standard approaches use IndexedDB for blobs. Here we assume payload is JSON).
            await api({
              url: action.endpoint,
              method: action.method,
              data: action.payload,
            });
            
            removeAction(action.id);
            successCount++;
          } catch (err: any) {
            set((state) => ({
              actions: state.actions.map((a) =>
                a.id === action.id 
                  ? { ...a, status: "FAILED", error: err.message, retryCount: a.retryCount + 1 }
                  : a
              ),
            }));
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} actions synchronisées avec succès.`);
        }
      },
    }),
    {
      name: "gmao-sync-storage",
      partialize: (state) => ({ actions: state.actions }), // Only persist actions
    }
  )
);

// Register online/offline listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => useSyncStore.getState().setOnlineStatus(true));
  window.addEventListener("offline", () => useSyncStore.getState().setOnlineStatus(false));
}
