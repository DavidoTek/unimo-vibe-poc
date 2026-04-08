import { create } from "zustand";
import { INITIAL_POIS } from "./mockData";
import type { Poi, Reservation } from "./types";

type ExploreState = {
  pois: Poi[];
  reservations: Reservation[];
  reserveVehicle: (poiId: string) => void;
  startRide: (reservationId: string) => void;
  addTripUsage: (reservationId: string, distanceKm: number, durationMin: number) => void;
  returnVehicle: (reservationId: string) => void;
};

const isMobilityPoi = (poi: Poi) => poi.type === "scooter" || poi.type === "car" || poi.type === "bike";

export const useExploreStore = create<ExploreState>((set, get) => ({
  pois: INITIAL_POIS,
  reservations: [],

  reserveVehicle: (poiId) => {
    const state = get();
    const poi = state.pois.find((item) => item.id === poiId);
    if (!poi || !isMobilityPoi(poi) || poi.status !== "available") {
      return;
    }

    const hasOpenReservation = state.reservations.some(
      (reservation) => reservation.poiId === poiId && reservation.status !== "completed",
    );
    if (hasOpenReservation) {
      return;
    }

    const reservation: Reservation = {
      id: `res-${Math.random().toString(36).slice(2, 10)}`,
      poiId,
      status: "reserved",
      reservedAt: Date.now(),
      distanceKm: 0,
      durationMin: 0,
      totalCost: 0,
    };

    set({
      reservations: [reservation, ...state.reservations],
      pois: state.pois.map((item) => (item.id === poiId ? { ...item, status: "reserved" } : item)),
    });
  },

  startRide: (reservationId) => {
    const state = get();
    const targetReservation = state.reservations.find((item) => item.id === reservationId);
    if (!targetReservation || targetReservation.status !== "reserved") {
      return;
    }

    const poi = state.pois.find((item) => item.id === targetReservation.poiId);
    if (!poi || !isMobilityPoi(poi) || !poi.pricing) {
      return;
    }

    const unlockCost = poi.pricing.unlockPrice;

    set({
      reservations: state.reservations.map((item) =>
        item.id === reservationId
          ? {
              ...item,
              status: "active",
              startedAt: Date.now(),
              totalCost: unlockCost,
            }
          : item,
      ),
      pois: state.pois.map((item) => (item.id === poi.id ? { ...item, status: "in-service" } : item)),
    });
  },

  addTripUsage: (reservationId, distanceKm, durationMin) => {
    const state = get();
    const reservation = state.reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.status !== "active") {
      return;
    }

    const poi = state.pois.find((item) => item.id === reservation.poiId);
    if (!poi || !isMobilityPoi(poi) || !poi.pricing) {
      return;
    }
    const pricing = poi.pricing;

    set({
      reservations: state.reservations.map((item) => {
        if (item.id !== reservationId || item.status !== "active") {
          return item;
        }

        const nextDistance = Math.max(0, item.distanceKm + distanceKm);
        const nextDuration = Math.max(0, item.durationMin + durationMin);
        const nextTotal = pricing.unlockPrice + nextDistance * pricing.perKm + nextDuration * pricing.perMinute;

        return {
          ...item,
          distanceKm: nextDistance,
          durationMin: nextDuration,
          totalCost: Number(nextTotal.toFixed(2)),
        };
      }),
    });
  },

  returnVehicle: (reservationId) => {
    const state = get();
    const reservation = state.reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.status === "completed") {
      return;
    }

    set({
      reservations: state.reservations.map((item) =>
        item.id === reservationId
          ? {
              ...item,
              status: "completed",
              endedAt: Date.now(),
            }
          : item,
      ),
      pois: state.pois.map((item) => (item.id === reservation.poiId ? { ...item, status: "available" } : item)),
    });
  },
}));
