import { create } from "zustand";
import { TRANSPORT_MODES } from "./searchCatalog";

export type SelectedRoute = {
  id: string;
  line: string;
  type: string;
  mode: string;
  details: string;
  durationMin: number;
  price: number;
  geometry: [number, number][];
};

type SearchDraftState = {
  from: string;
  to: string;
  selectedModes: string[];
  selectedRoute: SelectedRoute | null;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  toggleMode: (value: string) => void;
  setSelectedRoute: (route: SelectedRoute | null) => void;
  swap: () => void;
};

export const useSearchDraftStore = create<SearchDraftState>((set) => ({
  from: "",
  to: "",
  selectedModes: [TRANSPORT_MODES[0], TRANSPORT_MODES[1]],
  selectedRoute: null,
  setFrom: (value) => set({ from: value }),
  setTo: (value) => set({ to: value }),
  toggleMode: (value) =>
    set((state) => ({
      selectedModes: state.selectedModes.includes(value)
        ? state.selectedModes.filter((mode) => mode !== value)
        : [...state.selectedModes, value],
    })),
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  swap: () => set((state) => ({ from: state.to, to: state.from })),
}));
