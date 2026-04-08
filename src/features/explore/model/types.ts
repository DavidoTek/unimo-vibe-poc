export type PoiType = "scooter" | "car" | "bike" | "station";

export type PoiStatus = "available" | "reserved" | "in-service";

export type Pricing = {
  currency: "EUR";
  unlockPrice: number;
  perMinute: number;
  perKm: number;
};

export type Poi = {
  id: string;
  type: PoiType;
  lat: number;
  lng: number;
  name: string;
  provider: string;
  battery?: number;
  fuel?: number;
  model?: string;
  status: PoiStatus;
  pricing?: Pricing;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
  source: "search" | "map-click";
};

export type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  addresstype?: string;
  class?: string;
};

export type ReservationStatus = "reserved" | "active" | "completed";

export type Reservation = {
  id: string;
  poiId: string;
  status: ReservationStatus;
  reservedAt: number;
  startedAt?: number;
  endedAt?: number;
  distanceKm: number;
  durationMin: number;
  totalCost: number;
};
