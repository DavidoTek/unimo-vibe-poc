export const TRANSPORT_MODES = [
  "Regional trains",
  "Busses",
  "Long-distance trains",
  "e-scooter",
  "bicycle",
  "car sharing",
  "taxi",
] as const;

export type TransportMode = (typeof TRANSPORT_MODES)[number];

export type RideOption = {
  id: string;
  type: string;
  mode: TransportMode;
  line: string;
  dep: string;
  arr: string;
  price: number;
  durationMin: number;
  details: string;
  geometry: [number, number][];
};

export const DUMMY_RIDE_OPTIONS: RideOption[] = [
  {
    id: "ride-regional-1",
    type: "Train",
    mode: "Regional trains",
    line: "S1",
    dep: "10:05",
    arr: "10:32",
    price: 3.4,
    durationMin: 27,
    details: "Regional line with one transfer at Friedrichstrasse.",
    geometry: [
      [13.369, 52.525],
      [13.381, 52.521],
      [13.395, 52.518],
      [13.412, 52.513],
    ],
  },
  {
    id: "ride-bus-1",
    type: "Bus",
    mode: "Busses",
    line: "M41",
    dep: "10:12",
    arr: "10:45",
    price: 2.8,
    durationMin: 33,
    details: "Direct bus route with frequent departures.",
    geometry: [
      [13.376, 52.509],
      [13.389, 52.514],
      [13.403, 52.52],
      [13.421, 52.527],
    ],
  },
  {
    id: "ride-ld-1",
    type: "Long-distance train",
    mode: "Long-distance trains",
    line: "ICE 702",
    dep: "10:20",
    arr: "10:48",
    price: 9.9,
    durationMin: 28,
    details: "Fastest option, platform access included.",
    geometry: [
      [13.369, 52.525],
      [13.386, 52.528],
      [13.406, 52.53],
      [13.433, 52.533],
    ],
  },
  {
    id: "ride-scooter-1",
    type: "e-scooter",
    mode: "e-scooter",
    line: "line #104",
    dep: "10:08",
    arr: "10:31",
    price: 5.2,
    durationMin: 23,
    details: "Shared scooter ride with bike-lane preference.",
    geometry: [
      [13.405, 52.52],
      [13.41, 52.516],
      [13.418, 52.511],
      [13.426, 52.508],
    ],
  },
  {
    id: "ride-bike-1",
    type: "Bike",
    mode: "bicycle",
    line: "rabbit bike #19",
    dep: "10:06",
    arr: "10:34",
    price: 3.1,
    durationMin: 28,
    details: "Eco route mostly along protected cycle paths.",
    geometry: [
      [13.389, 52.515],
      [13.397, 52.512],
      [13.409, 52.507],
      [13.421, 52.503],
    ],
  },
  {
    id: "ride-carshare-1",
    type: "Car sharing",
    mode: "car sharing",
    line: "bult City EV",
    dep: "10:07",
    arr: "10:24",
    price: 8.7,
    durationMin: 17,
    details: "Door-to-door with parking zone at destination.",
    geometry: [
      [13.38, 52.51],
      [13.394, 52.509],
      [13.411, 52.506],
      [13.428, 52.504],
    ],
  },
  {
    id: "ride-taxi-1",
    type: "Taxi",
    mode: "taxi",
    line: "UberX",
    dep: "10:07",
    arr: "10:22",
    price: 14.5,
    durationMin: 15,
    details: "Fast pickup with dynamic pricing.",
    geometry: [
      [13.402, 52.519],
      [13.414, 52.514],
      [13.426, 52.509],
      [13.438, 52.503],
    ],
  },
];
