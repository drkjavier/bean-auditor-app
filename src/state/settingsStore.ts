import { create } from 'zustand';

type SettingsState = {
  // When true, the native map will show the user's location pin/button
  showUserLocation: boolean;
  setShowUserLocation: (v: boolean) => void;
};

// Simple in-memory settings store. Persistencia puede añadirse luego si es necesario.
export const useSettingsStore = create<SettingsState>((set) => ({
  showUserLocation: false,
  setShowUserLocation: (v: boolean) => set({ showUserLocation: v }),
}));

export default useSettingsStore;
