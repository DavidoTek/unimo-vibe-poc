// src/features/search/SearchResultsPage.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Euro, Navigation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSearchDraftStore } from "./model/searchDraftStore";
import { DUMMY_RIDE_OPTIONS } from "./model/searchCatalog";
import { cn } from "@/lib/utils";
import { useTicketsStore } from "../tickets/model/ticketsStore";

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedModes, selectedRoute, setSelectedRoute } = useSearchDraftStore();
  const { buyTicket, hasDeutschlandticket, requestOpenTicket } = useTicketsStore();
  const [selectedRideId, setSelectedRideId] = useState<string | null>(selectedRoute?.id ?? null);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const filteredResults = useMemo(() => {
    return DUMMY_RIDE_OPTIONS.filter((ride) => selectedModes.includes(ride.mode));
  }, [selectedModes]);

  const effectiveSelectedRideId =
    selectedRideId && filteredResults.some((ride) => ride.id === selectedRideId)
      ? selectedRideId
      : (filteredResults[0]?.id ?? null);

  const selectedRide = useMemo(() => {
    if (!effectiveSelectedRideId) return null;
    return filteredResults.find((ride) => ride.id === effectiveSelectedRideId) ?? null;
  }, [effectiveSelectedRideId, filteredResults]);

  useEffect(() => {
    if (!selectedRide) return;

    setSelectedRoute({
      id: selectedRide.id,
      type: selectedRide.type,
      mode: selectedRide.mode,
      line: selectedRide.line,
      details: selectedRide.details,
      durationMin: selectedRide.durationMin,
      price: selectedRide.price,
      geometry: selectedRide.geometry,
    });
  }, [selectedRide, setSelectedRoute]);

  const handleBuyTicket = () => {
    if (!selectedRide) {
      return;
    }

    buyTicket({
      routeId: selectedRide.id,
      title: `${selectedRide.type} ${selectedRide.line}`,
      mode: selectedRide.mode,
      from: from || "Current location",
      to: to || "Destination",
      price: selectedRide.price,
      provider: selectedRide.line,
    });
  };

  const isDeutschlandticketEligible =
    selectedRide?.mode === "Regional trains" || selectedRide?.mode === "Busses";

  const handleDeutschlandticketAction = () => {
    requestOpenTicket("deutschlandticket");
    navigate("/tickets");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Suggested Rides</h2>
          <p className="text-xs text-muted-foreground truncate">
            {from || "Current location"} to {to || "destination"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              No rides match your selected transport modes.
            </CardContent>
          </Card>
        ) : (
          filteredResults.map((ride) => (
            <Card
              key={ride.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedRideId === ride.id ? "ring-2 ring-primary/30 border-primary/40" : "hover:ring-2 ring-primary/20",
              )}
              onClick={() => setSelectedRideId(ride.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                      {ride.line}
                    </span>
                    <span className="font-bold text-lg">{ride.dep} — {ride.arr}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={14} /> {ride.durationMin} min</span>
                    <span className="flex items-center gap-1"><Euro size={14} /> {ride.price.toFixed(2)}</span>
                    <span>{ride.mode}</span>
                  </div>
                </div>
                <Button variant="outline">Select</Button>
              </CardContent>
            </Card>
          ))
        )}

        {selectedRide ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold">{selectedRide.type} {selectedRide.line}</h3>
                <p className="text-sm text-muted-foreground">{selectedRide.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-muted-foreground">Duration:</span> {selectedRide.durationMin} min</p>
                <p><span className="text-muted-foreground">Price:</span> EUR {selectedRide.price.toFixed(2)}</p>
              </div>

              {isDeutschlandticketEligible && hasDeutschlandticket ? (
                <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm text-muted-foreground">
                    This ride is covered by the Deutschlandticket.
                  </p>
                  <Button className="w-full" variant="secondary" onClick={handleDeutschlandticketAction}>
                    Open Deutschlandticket
                  </Button>
                </div>
              ) : (
                <Button className="w-full" onClick={handleBuyTicket}>
                  Buy ticket (PoC)
                </Button>
              )}

              <div className="flex gap-2 md:hidden">
                <Button className="w-full" onClick={() => navigate("/explore")}> 
                  <Navigation size={16} /> Show map
                </Button>
              </div>
              <p className="hidden md:block text-xs text-muted-foreground">Route is shown on the map.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}