// src/features/explore/ExplorePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Input } from "@/components/ui/input";
import {
  Search,
  Battery,
  Train,
  Bike,
  Car,
  Scooter,
  MapPin,
  Loader2,
  Navigation,
  Route,
  Lock,
  Ticket,
  Play,
  RotateCcw,
  Gauge,
  Clock3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { useExploreStore } from "./model/store";
import type { GeocodeResult, NominatimResult, Poi, PoiType } from "./model/types";
import { useSearchDraftStore } from "../search/model/searchDraftStore";
import { useNavigate } from "react-router-dom";

const DETAILED_MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const DEFAULT_CENTER = { lng: 13.405, lat: 52.52 };
const DEFAULT_ZOOM = 13;

export default function ExplorePage() {
  const { pois, reservations, reserveVehicle, startRide, addTripUsage, returnVehicle } = useExploreStore();
  const { setFrom, setTo, selectedRoute } = useSearchDraftStore();
  const navigate = useNavigate();

  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null);
  const [isResolvingMapClick, setIsResolvingMapClick] = useState(false);
  const [showReservedOptions, setShowReservedOptions] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const mapRef = useRef<MapRef | null>(null);

  const selectedPoi = useMemo(() => pois.find((poi) => poi.id === selectedPoiId) ?? null, [pois, selectedPoiId]);
  const hasSelection = !!selectedPoi || !!selectedLocation;
  const hasMobilityShareSelection = !!selectedPoi && selectedPoi.type !== "station";
  const selectedReservation = useMemo(() => {
    if (!selectedPoi) return null;
    return reservations.find((reservation) => reservation.poiId === selectedPoi.id && reservation.status !== "completed") ?? null;
  }, [reservations, selectedPoi]);

  const reservationItems = useMemo(() => {
    return reservations
      .map((reservation) => ({
        reservation,
        poi: pois.find((poi) => poi.id === reservation.poiId) ?? null,
      }))
      .filter((item) => item.poi);
  }, [pois, reservations]);

  const activeTripCount = useMemo(
    () => reservations.filter((reservation) => reservation.status === "active").length,
    [reservations],
  );
  const reservedCount = useMemo(
    () => reservations.filter((reservation) => reservation.status === "reserved").length,
    [reservations],
  );
  const activeOrReservedCount = activeTripCount + reservedCount;

  const reservedPanelToneClass =
    activeTripCount > 0
      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
      : reservedCount > 0
        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
        : "bg-background/95 hover:bg-background text-foreground border-border/70";

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const withDistance = pois.map((poi) => {
      const latDiff = poi.lat - mapCenter.lat;
      const lngDiff = poi.lng - mapCenter.lng;
      const distanceScore = latDiff * latDiff + lngDiff * lngDiff;
      return { poi, distanceScore };
    });

    const nearby = withDistance.sort((a, b) => a.distanceScore - b.distanceScore).map((entry) => entry.poi);
    if (!normalizedQuery) return nearby.slice(0, 6);

    return nearby
      .filter((poi) => {
        const searchableText = `${poi.name} ${poi.provider} ${poi.type} ${poi.model ?? ""}`.toLowerCase();
        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [mapCenter.lat, mapCenter.lng, pois, query]);

  const formatCoords = (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const formatEur = (value: number) => `EUR ${value.toFixed(2)}`;

  const focusPoiOnMap = (poi: Poi) => {
    mapRef.current?.flyTo({ center: [poi.lng, poi.lat], zoom: 15, essential: true });
    setSelectedPoiId(poi.id);
    setSelectedLocation(null);
  };

  const closeDetails = () => {
    setSelectedPoiId(null);
    setSelectedLocation(null);
  };

  const getMobilityCtaLabel = (poi: Poi) => {
    if (selectedReservation?.status === "reserved") return "Unlock vehicle";
    if (selectedReservation?.status === "active") return "Vehicle in use";
    if (poi.type === "car") return "Book car";
    if (poi.type === "bike") return "Reserve bike";
    if (poi.type === "scooter") return "Reserve scooter";
    return "Reserve";
  };

  const handlePrimaryMobilityAction = () => {
    if (!selectedPoi || selectedPoi.type === "station") return;
    if (!selectedReservation && selectedPoi.status === "available") {
      reserveVehicle(selectedPoi.id);
      return;
    }
    if (selectedReservation?.status === "reserved") {
      startRide(selectedReservation.id);
    }
  };

  const resolveAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      setIsResolvingMapClick(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(`Reverse geocoding request failed with status ${response.status}`);

      const data = (await response.json()) as { display_name?: string };
      const resolvedName = data.display_name?.trim();
      setSelectedLocation({
        lat,
        lng,
        displayName: resolvedName || `Selected location (${formatCoords(lat, lng)})`,
        source: "map-click",
      });
    } catch {
      setSelectedLocation({
        lat,
        lng,
        displayName: `Selected location (${formatCoords(lat, lng)})`,
        source: "map-click",
      });
    } finally {
      setIsResolvingMapClick(false);
    }
  };

  const handleMapBackgroundClick = (lng: number, lat: number) => {
    setSelectedPoiId(null);
    setShowSuggestions(false);
    setSelectedLocation({
      lat,
      lng,
      displayName: `Selected location (${formatCoords(lat, lng)})`,
      source: "map-click",
    });
    void resolveAddressFromCoordinates(lat, lng);
  };

  const searchAddress = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const matchingPoi = pois.find((poi) => {
      const searchableText = `${poi.name} ${poi.provider} ${poi.type} ${poi.model ?? ""}`.toLowerCase();
      return searchableText.includes(trimmedQuery.toLowerCase());
    });

    if (matchingPoi) {
      focusPoiOnMap(matchingPoi);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsSearchingAddress(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(trimmedQuery)}`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) throw new Error(`Geocoding request failed with status ${response.status}`);

      const data = (await response.json()) as NominatimResult[];
      const firstResult = data[0];
      if (!firstResult || !isAddressLikeResult(firstResult)) {
        setSelectedLocation(null);
        setSelectedPoiId(null);
        setShowSuggestions(false);
        return;
      }

      const result: GeocodeResult = {
        lat: Number(firstResult.lat),
        lng: Number(firstResult.lon),
        displayName: firstResult.display_name,
        source: "search",
      };

      setSelectedLocation(result);
      setSelectedPoiId(null);
      setShowSuggestions(false);
      mapRef.current?.flyTo({ center: [result.lng, result.lat], zoom: 15, essential: true });
    } catch {
      setSelectedLocation(null);
      setShowSuggestions(false);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const suggestionIcon = (type: PoiType) => {
    if (type === "scooter") return <Scooter size={14} className="text-yellow-600" />;
    if (type === "car") return <Car size={14} className="text-blue-600" />;
    if (type === "bike") return <Bike size={14} className="text-emerald-600" />;
    return <Train size={14} className="text-primary" />;
  };

  const markerBgClass = (poi: Poi) => {
    if (poi.status === "in-service") return "bg-neutral-900";
    if (poi.status === "reserved") return "bg-orange-500";
    if (poi.type === "scooter") return "bg-yellow-400";
    if (poi.type === "car") return "bg-blue-500";
    if (poi.type === "bike") return "bg-emerald-500";
    return "bg-primary";
  };

  const getSelectedLabel = () => {
    if (selectedPoi) return selectedPoi.name;
    if (selectedLocation) return selectedLocation.displayName;
    return "";
  };

  const handleNavigateTo = () => {
    const label = getSelectedLabel();
    if (!label) return;
    setTo(label);
    if (isMobile) {
      navigate("/");
    }
  };

  const handleNavigateFrom = () => {
    const label = getSelectedLabel();
    if (!label) return;
    setFrom(label);
    if (isMobile) {
      navigate("/");
    }
  };

  function isAddressLikeResult(result: NominatimResult) {
    if (!result.lat || !result.lon) return false;

    const addressType = (result.addresstype ?? result.type ?? "").toLowerCase();
    const classType = (result.class ?? "").toLowerCase();
    const addressKeywords = ["house", "building", "residential", "road", "street", "pedestrian", "footway", "path", "address", "suburb", "neighbourhood"];
    const classAllowList = ["highway", "building", "place", "amenity"];

    return classAllowList.includes(classType) || addressKeywords.some((keyword) => addressType.includes(keyword));
  }

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!selectedRoute || selectedRoute.geometry.length < 2) {
      return;
    }

    const lngs = selectedRoute.geometry.map(([lng]) => lng);
    const lats = selectedRoute.geometry.map(([, lat]) => lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    mapRef.current?.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: isMobile ? 50 : 90, duration: 700 },
    );
  }, [isMobile, selectedRoute]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-0 right-0 z-20 px-4 md:px-8 pointer-events-none">
        <div className="relative max-w-md mx-auto pointer-events-auto">
          <Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void searchAddress();
              }
            }}
            placeholder="Search stations, vehicles, streets..."
            className="pl-10 pr-14 h-12 shadow-xl bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void searchAddress()}
            aria-label="Search"
          >
            {isSearchingAddress ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </Button>

          {showSuggestions && filteredSuggestions.length > 0 ? (
            <Card className="mt-2 overflow-hidden border border-border/70 bg-background/95 backdrop-blur-md shadow-xl">
              <div className="max-h-72 overflow-y-auto py-1">
                {filteredSuggestions.map((poi) => (
                  <button
                    key={poi.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery(poi.name);
                      setShowSuggestions(false);
                      focusPoiOnMap(poi);
                    }}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">{suggestionIcon(poi.type)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{poi.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{poi.provider}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <Map
        ref={mapRef}
        initialViewState={{ longitude: DEFAULT_CENTER.lng, latitude: DEFAULT_CENTER.lat, zoom: DEFAULT_ZOOM }}
        mapStyle={DETAILED_MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        onMove={(event) => {
          setMapCenter({ lng: event.viewState.longitude, lat: event.viewState.latitude });
        }}
        onClick={(event) => {
          handleMapBackgroundClick(event.lngLat.lng, event.lngLat.lat);
        }}
      >
        <NavigationControl position="bottom-right" />

        {pois.map((poi) => (
          <Marker
            key={poi.id}
            longitude={poi.lng}
            latitude={poi.lat}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setSelectedLocation(null);
              setSelectedPoiId(poi.id);
            }}
          >
            <div className={`p-2 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110 ${markerBgClass(poi)}`}>
              {poi.type === "scooter" && <Scooter size={16} className="text-black" />}
              {poi.type === "car" && <Car size={16} className="text-white" />}
              {poi.type === "bike" && <Bike size={16} className="text-white" />}
              {poi.type === "station" && <Train size={16} className="text-white" />}
            </div>
          </Marker>
        ))}

        {selectedLocation ? (
          <Marker longitude={selectedLocation.lng} latitude={selectedLocation.lat} anchor="bottom">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg">
              <MapPin size={16} />
            </div>
          </Marker>
        ) : null}

        {selectedRoute && selectedRoute.geometry.length >= 2 ? (
          <Source
            id="selected-route"
            type="geojson"
            data={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: selectedRoute.geometry,
              },
              properties: {},
            }}
          >
            <Layer
              id="selected-route-outline"
              type="line"
              paint={{
                "line-color": "#0f172a",
                "line-width": 8,
                "line-opacity": 0.35,
              }}
            />
            <Layer
              id="selected-route-line"
              type="line"
              paint={{
                "line-color": "#0ea5e9",
                "line-width": 5,
                "line-opacity": 0.95,
              }}
            />
          </Source>
        ) : null}
      </Map>

      <Drawer open={isMobile && hasSelection} onOpenChange={(open) => !open && closeDetails()}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <DrawerTitle className="text-2xl">{selectedPoi?.name ?? selectedLocation?.displayName ?? "Selected location"}</DrawerTitle>
                  {selectedPoi ? (
                    <DrawerDescription>
                      {selectedPoi.provider}
                      {selectedPoi.model ? ` • ${selectedPoi.model}` : ""}
                    </DrawerDescription>
                  ) : (
                    <DrawerDescription>
                      {selectedLocation ? formatCoords(selectedLocation.lat, selectedLocation.lng) : ""}
                      {isResolvingMapClick ? " • Resolving address..." : ""}
                    </DrawerDescription>
                  )}
                  {selectedPoi?.pricing ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Unlock {formatEur(selectedPoi.pricing.unlockPrice)} • {formatEur(selectedPoi.pricing.perMinute)}/min • {formatEur(selectedPoi.pricing.perKm)}/km
                    </p>
                  ) : null}
                </div>
                {selectedPoi?.battery ? (
                  <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-sm font-bold">
                    <Battery size={14} /> {selectedPoi.battery}%
                  </div>
                ) : selectedPoi?.fuel ? (
                  <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-sm font-bold">
                    <Battery size={14} /> Fuel {selectedPoi.fuel}%
                  </div>
                ) : null}
              </div>
            </DrawerHeader>

            <DrawerFooter className="gap-2">
              {hasMobilityShareSelection ? (
                <Button className="h-12 w-full gap-2" onClick={handlePrimaryMobilityAction} disabled={selectedReservation?.status === "active"}>
                  <Lock size={16} /> {getMobilityCtaLabel(selectedPoi)}
                </Button>
              ) : null}
              <div className="flex gap-2">
                <Button className="flex-1 h-12 text-sm gap-2" onClick={handleNavigateTo}>
                  <Navigation size={16} /> Navigate to
                </Button>
                <Button variant="outline" className="h-12 gap-2" onClick={handleNavigateFrom}>
                  <Route size={16} /> From here
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {!isMobile && hasSelection ? (
        <Card className="absolute bottom-8 left-8 w-[24rem] p-6 z-20 shadow-2xl border-border/70 bg-card/95 backdrop-blur-sm animate-in slide-in-from-left-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold leading-tight">{selectedPoi?.name ?? selectedLocation?.displayName ?? "Selected location"}</h3>
              {selectedPoi ? (
                <p className="text-muted-foreground">
                  {selectedPoi.provider}
                  {selectedPoi.model ? ` • ${selectedPoi.model}` : ""}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {selectedLocation ? formatCoords(selectedLocation.lat, selectedLocation.lng) : ""}
                  {isResolvingMapClick ? " • Resolving address..." : ""}
                </p>
              )}
              {selectedPoi?.pricing ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Unlock {formatEur(selectedPoi.pricing.unlockPrice)} • {formatEur(selectedPoi.pricing.perMinute)}/min • {formatEur(selectedPoi.pricing.perKm)}/km
                </p>
              ) : null}
            </div>
            {selectedPoi?.battery ? (
              <div className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-sm font-bold text-green-700">
                <Battery size={14} /> {selectedPoi.battery}%
              </div>
            ) : selectedPoi?.fuel ? (
              <div className="flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-sm font-bold text-amber-700">
                <Battery size={14} /> Fuel {selectedPoi.fuel}%
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            {hasMobilityShareSelection ? (
              <Button className="w-full h-11 gap-2" onClick={handlePrimaryMobilityAction} disabled={selectedReservation?.status === "active"}>
                <Lock size={16} /> {getMobilityCtaLabel(selectedPoi)}
              </Button>
            ) : null}
            <Button className="w-full h-11 gap-2" onClick={handleNavigateTo}>
              <Navigation size={16} /> Navigate to
            </Button>
            <Button variant="outline" className="w-full h-11 gap-2" onClick={handleNavigateFrom}>
              <Route size={16} /> Navigate from here
            </Button>
            <Button variant="ghost" className="w-full h-11" onClick={closeDetails}>
              Close details
            </Button>
          </div>
        </Card>
      ) : null}

      {!isMobile ? (
        <div className="absolute right-12 bottom-16 md:right-14 md:bottom-18 z-20 flex flex-col items-end gap-2">
          {showReservedOptions ? (
            <Card className="w-[21rem] max-h-[42vh] overflow-y-auto border-border/70 bg-background/95 backdrop-blur-sm shadow-xl">
            <div className="p-4 border-b border-border/60">
              <h4 className="text-sm font-semibold">Reserved options</h4>
              <p className="text-xs text-muted-foreground">PoC reservation lifecycle for mobility sharing</p>
            </div>

            <div className="p-3 space-y-3">
              {reservationItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">No reserved options yet.</p>
              ) : (
                reservationItems.map(({ reservation, poi }) => {
                  if (!poi) return null;
                  const isActive = reservation.status === "active";
                  const isReserved = reservation.status === "reserved";
                  const isCompleted = reservation.status === "completed";

                  return (
                    <div key={reservation.id} className="rounded-lg border border-border/70 bg-card/80 p-3 space-y-2">
                      <div>
                        <p className="text-sm font-medium leading-tight">{poi.name}</p>
                        <p className="text-xs text-muted-foreground">{poi.provider} • {poi.type}</p>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Status: {reservation.status}</p>
                        <p className="flex items-center gap-1"><Gauge size={12} /> {reservation.distanceKm.toFixed(1)} km</p>
                        <p className="flex items-center gap-1"><Clock3 size={12} /> {reservation.durationMin} min</p>
                        <p>Total: {formatEur(reservation.totalCost)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isReserved ? (
                          <Button size="sm" className="h-8" onClick={() => startRide(reservation.id)}>
                            <Play size={14} /> Unlock
                          </Button>
                        ) : null}
                        {isActive ? (
                          <>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => addTripUsage(reservation.id, 1, 0)}>
                              +1 km
                            </Button>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => addTripUsage(reservation.id, 0, 5)}>
                              +5 min
                            </Button>
                            <Button size="sm" className="h-8" onClick={() => returnVehicle(reservation.id)}>
                              <RotateCcw size={14} /> Return
                            </Button>
                          </>
                        ) : null}
                        {isCompleted ? <span className="text-xs text-muted-foreground">Trip completed</span> : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </Card>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={`relative h-14 w-14 rounded-full border shadow-md backdrop-blur-sm ${reservedPanelToneClass}`}
            onClick={() => setShowReservedOptions((current) => !current)}
            aria-label={showReservedOptions ? "Hide reserved options" : "Open reserved options"}
            title={showReservedOptions ? "Hide reserved options" : "Open reserved options"}
          >
            <Ticket size={26} />
            {activeOrReservedCount > 0 ? (
              <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
                {activeOrReservedCount}
              </span>
            ) : null}
          </Button>
        </div>
      ) : null}
    </div>
  );
}