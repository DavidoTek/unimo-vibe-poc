// src/features/search/SearchPage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MapPin, Calendar as CalendarIcon, Users, ArrowUpDown, Check, ChevronDown, Minus, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSearchDraftStore } from "./model/searchDraftStore";
import { TRANSPORT_MODES } from "./model/searchCatalog";
import { PLACE_FAVORITES, ROUTE_FAVORITES } from "./model/favorites";
import { INITIAL_POIS } from "../explore/model/mockData";

type Passenger = {
  id: number;
  age: string;
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const { from, to, setFrom, setTo, swap, selectedModes, toggleMode, setSelectedRoute } = useSearchDraftStore();
  const [passengers, setPassengers] = useState<Passenger[]>([{ id: 1, age: "30" }]);
  const [isPassengerDrawerOpen, setIsPassengerDrawerOpen] = useState(false);
  const [isModesDrawerOpen, setIsModesDrawerOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<"from" | "to" | null>(null);

  const suggestionPool = useMemo(() => {
    const poiNames = INITIAL_POIS.map((poi) => poi.name);
    const placeAddresses = PLACE_FAVORITES.flatMap((favorite) => [favorite.label, favorite.address]);
    const routeEndpoints = ROUTE_FAVORITES.flatMap((favorite) => [favorite.from, favorite.to]);
    const streets = ["Unter den Linden", "Friedrichstrasse", "Karl-Marx-Allee", "Oranienburger Strasse", "Torstrasse"];

    return Array.from(new Set([...poiNames, ...placeAddresses, ...routeEndpoints, ...streets]));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedRoute(null);
    // In a real app, we'd pass these as query params
    navigate(`/search/results?from=${from}&to=${to}`);
  };

  const swapLocations = () => {
    swap();
  };

  const passengerCount = passengers.length;
  const passengerSummary = `${passengerCount} ${passengerCount === 1 ? "passenger" : "passengers"}`;

  const modeSummary =
    selectedModes.length === 0
      ? "Select transport modes"
      : selectedModes.length <= 2
      ? selectedModes.join(", ")
      : `${selectedModes.slice(0, 2).join(", ")} +${selectedModes.length - 2} more`;

  const addPassenger = () => {
    setPassengers((current) => {
      const nextId = current.length === 0 ? 1 : Math.max(...current.map((p) => p.id)) + 1;
      return [...current, { id: nextId, age: "" }];
    });
  };

  const removePassenger = (id: number) => {
    setPassengers((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((passenger) => passenger.id !== id);
    });
  };

  const updatePassengerAge = (id: number, age: string) => {
    setPassengers((current) =>
      current.map((passenger) => (passenger.id === id ? { ...passenger, age } : passenger))
    );
  };

  const fromSuggestions = useMemo(() => {
    const normalizedQuery = from.trim().toLowerCase();
    if (!normalizedQuery) return suggestionPool.slice(0, 8);

    const startsWith = suggestionPool.filter((entry) => entry.toLowerCase().startsWith(normalizedQuery));
    const includes = suggestionPool.filter(
      (entry) => !startsWith.includes(entry) && entry.toLowerCase().includes(normalizedQuery)
    );
    return [...startsWith, ...includes].slice(0, 8);
  }, [from, suggestionPool]);

  const toSuggestions = useMemo(() => {
    const normalizedQuery = to.trim().toLowerCase();
    if (!normalizedQuery) return suggestionPool.slice(0, 8);

    const startsWith = suggestionPool.filter((entry) => entry.toLowerCase().startsWith(normalizedQuery));
    const includes = suggestionPool.filter(
      (entry) => !startsWith.includes(entry) && entry.toLowerCase().includes(normalizedQuery)
    );
    return [...startsWith, ...includes].slice(0, 8);
  }, [to, suggestionPool]);

  const applySuggestion = (field: "from" | "to", value: string) => {
    if (field === "from") {
      setFrom(value);
    } else {
      setTo(value);
    }
    setActiveInput(null);
  };

  const applyPlaceFavorite = (target: "from" | "to", value: string) => {
    applySuggestion(target, value);
  };

  const applyRouteFavorite = (fromValue: string, toValue: string) => {
    setFrom(fromValue);
    setTo(toValue);
    setActiveInput(null);
  };

  return (
    <div className="p-4 md:p-5 space-y-4 max-w-2xl">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Where to?</h2>
        <p className="text-muted-foreground">Find the best way across the city.</p>
      </header>

      <form onSubmit={handleSearch} className="space-y-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-4 md:p-5 space-y-3 relative">
            {/* From/To Inputs */}
            <div className="space-y-1.5">
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="From (current location)" 
                  className="pl-10 h-10" 
                  value={from}
                  onFocus={() => setActiveInput("from")}
                  onBlur={() => window.setTimeout(() => setActiveInput(null), 120)}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setActiveInput("from");
                  }}
                />
                {activeInput === "from" && fromSuggestions.length > 0 ? (
                  <div className="absolute top-[2.75rem] z-30 w-full rounded-md border border-border/80 bg-background shadow-lg overflow-hidden">
                    {fromSuggestions.map((suggestion) => (
                      <button
                        key={`from-${suggestion}`}
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted/70"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applySuggestion("from", suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              
              {/* Swap Button */}
              <div className="relative flex justify-center -my-2 z-10">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-7 w-7 bg-background shadow-sm"
                  onClick={swapLocations}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
                <Input 
                  placeholder="Where to?" 
                  className="pl-10 h-10" 
                  value={to}
                  onFocus={() => setActiveInput("to")}
                  onBlur={() => window.setTimeout(() => setActiveInput(null), 120)}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setActiveInput("to");
                  }}
                />
                {activeInput === "to" && toSuggestions.length > 0 ? (
                  <div className="absolute top-[2.75rem] z-30 w-full rounded-md border border-border/80 bg-background shadow-lg overflow-hidden">
                    {toSuggestions.map((suggestion) => (
                      <button
                        key={`to-${suggestion}`}
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted/70"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applySuggestion("to", suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Date and Passengers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departure</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal h-10", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Passengers</Label>
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-10 font-normal md:hidden"
                    onClick={() => setIsPassengerDrawerOpen(true)}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{passengerSummary}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>

                  <Drawer direction="right" open={isPassengerDrawerOpen} onOpenChange={setIsPassengerDrawerOpen}>
                    <DrawerContent className="md:hidden h-dvh rounded-none border-l data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-none">
                      <DrawerHeader className="text-left border-b pb-3">
                        <DrawerTitle className="text-xl">Passengers</DrawerTitle>
                        <p className="text-xs text-muted-foreground">Add travelers and set an age for each one.</p>
                      </DrawerHeader>

                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {passengers.map((passenger, index) => (
                          <div key={passenger.id} className="grid grid-cols-[1fr_104px_auto] items-center gap-2 rounded-lg border p-3">
                            <p className="text-sm font-medium">Passenger {index + 1}</p>
                            <Input
                              type="number"
                              min="0"
                              max="120"
                              value={passenger.age}
                              onChange={(e) => updatePassengerAge(passenger.id, e.target.value)}
                              placeholder="Age"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removePassenger(passenger.id)}
                              disabled={passengers.length <= 1}
                              aria-label={`Remove passenger ${index + 1}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <DrawerFooter className="border-t">
                        <Button type="button" variant="secondary" className="w-full" onClick={addPassenger}>
                          <Plus className="h-4 w-4" />
                          Add passenger
                        </Button>
                        <DrawerClose asChild>
                          <Button type="button" className="w-full">Done</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>

                  <div className="hidden md:block">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between h-10 font-normal"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{passengerSummary}</span>
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-4" align="end">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold">Passengers</h4>
                            <p className="text-xs text-muted-foreground">Add travelers and set an age for each one.</p>
                          </div>

                          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                            {passengers.map((passenger, index) => (
                              <div key={passenger.id} className="grid grid-cols-[1fr_96px_auto] items-center gap-2">
                                <p className="text-sm font-medium">Passenger {index + 1}</p>
                                <Input
                                  type="number"
                                  min="0"
                                  max="120"
                                  value={passenger.age}
                                  onChange={(e) => updatePassengerAge(passenger.id, e.target.value)}
                                  placeholder="Age"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removePassenger(passenger.id)}
                                  disabled={passengers.length <= 1}
                                  aria-label={`Remove passenger ${index + 1}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <Button type="button" variant="secondary" className="w-full" onClick={addPassenger}>
                            <Plus className="h-4 w-4" />
                            Add passenger
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Transport modes</Label>
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 justify-between font-normal md:hidden"
                  onClick={() => setIsModesDrawerOpen(true)}
                >
                  <span className={cn("truncate text-left", selectedModes.length === 0 && "text-muted-foreground")}>
                    {modeSummary}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>

                <Drawer direction="right" open={isModesDrawerOpen} onOpenChange={setIsModesDrawerOpen}>
                  <DrawerContent className="md:hidden h-dvh rounded-none border-l data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-none">
                    <DrawerHeader className="text-left border-b pb-3">
                      <DrawerTitle className="text-xl">Transport modes</DrawerTitle>
                      <p className="text-xs text-muted-foreground">Choose one or multiple options.</p>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {TRANSPORT_MODES.map((mode) => {
                        const checked = selectedModes.includes(mode);

                        return (
                          <button
                            key={mode}
                            type="button"
                            className={cn(
                              "w-full flex items-center justify-between rounded-md border px-3 py-3 text-sm transition-colors",
                              checked
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border hover:bg-muted/60"
                            )}
                            onClick={() => toggleMode(mode)}
                          >
                            <span>{mode}</span>
                            {checked ? <Check className="h-4 w-4 text-primary" /> : null}
                          </button>
                        );
                      })}
                    </div>

                    <DrawerFooter className="border-t">
                      <DrawerClose asChild>
                        <Button type="button" className="w-full">Done</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                <div className="hidden md:block">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 justify-between font-normal"
                      >
                        <span className={cn("truncate text-left", selectedModes.length === 0 && "text-muted-foreground")}>
                          {modeSummary}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-4" align="start">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold">Select transport modes</h4>
                          <p className="text-xs text-muted-foreground">Choose one or multiple options.</p>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {TRANSPORT_MODES.map((mode) => {
                            const checked = selectedModes.includes(mode);

                            return (
                              <button
                                key={mode}
                                type="button"
                                className={cn(
                                  "w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
                                  checked
                                    ? "border-primary bg-primary/5 text-foreground"
                                    : "border-border hover:bg-muted/60"
                                )}
                                onClick={() => toggleMode(mode)}
                              >
                                <span>{mode}</span>
                                {checked ? <Check className="h-4 w-4 text-primary" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20">
          Find Rides
        </Button>
      </form>

      {/* Favorites */}
      <section className="pt-2">
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Favorites</h3>
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Places</p>
          {PLACE_FAVORITES.map((favorite) => (
            <Popover key={favorite.id}>
              <PopoverTrigger asChild>
                <button type="button" className="w-full flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted text-left transition-colors">
                  <div className="bg-muted p-1.5 rounded-full">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="font-medium">{favorite.label}</p>
                    <p className="text-xs text-muted-foreground">{favorite.address}</p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-3" align="start">
                <p className="text-xs text-muted-foreground mb-2">Use {favorite.label} as:</p>
                <div className="flex gap-2">
                  <Button type="button" className="w-full" size="sm" onClick={() => applyPlaceFavorite("from", favorite.address)}>
                    Start
                  </Button>
                  <Button type="button" variant="outline" className="w-full" size="sm" onClick={() => applyPlaceFavorite("to", favorite.address)}>
                    Destination
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Routes</p>
        <div className="space-y-2">
          {ROUTE_FAVORITES.map((favorite) => (
            <button
              key={favorite.id}
              type="button"
              className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border hover:bg-muted text-left transition-colors"
              onClick={() => applyRouteFavorite(favorite.from, favorite.to)}
            >
              <div>
                <p className="font-medium">{favorite.label}</p>
                <p className="text-xs text-muted-foreground truncate">{favorite.from} {"->"} {favorite.to}</p>
              </div>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}