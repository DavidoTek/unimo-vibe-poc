export type PlaceFavorite = {
  id: string;
  label: string;
  address: string;
};

export type RouteFavorite = {
  id: string;
  label: string;
  from: string;
  to: string;
};

export const PLACE_FAVORITES: PlaceFavorite[] = [
  { id: "place-home", label: "Home", address: "14 Gartenstrasse, Berlin" },
  { id: "place-office", label: "Office", address: "Potsdamer Platz 8, Berlin" },
  { id: "place-gym", label: "Gym", address: "Alex-Wedding Strasse 3, Berlin" },
];

export const ROUTE_FAVORITES: RouteFavorite[] = [
  {
    id: "route-home-office",
    label: "Home -> Office",
    from: "14 Gartenstrasse, Berlin",
    to: "Potsdamer Platz 8, Berlin",
  },
  {
    id: "route-office-gym",
    label: "Office -> Gym",
    from: "Potsdamer Platz 8, Berlin",
    to: "Alex-Wedding Strasse 3, Berlin",
  },
  {
    id: "route-home-hbf",
    label: "Home -> Hauptbahnhof",
    from: "14 Gartenstrasse, Berlin",
    to: "Berlin Hauptbahnhof",
  },
];
