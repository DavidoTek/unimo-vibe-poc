import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock3, Gauge, Play, RotateCcw, TicketCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useExploreStore } from "../explore/model/store";
import { useTicketsStore } from "./model/ticketsStore";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

type TicketDetailsData = {
  id: string;
  title: string;
  from: string;
  to: string;
  price: number;
  mode: string;
  provider: string;
  status: string;
};

function buildQrMatrix(source: string, size = 21) {
  const matrix: boolean[][] = [];
  let seed = 0;
  for (let index = 0; index < source.length; index += 1) {
    seed = (seed * 31 + source.charCodeAt(index)) % 2147483647;
  }

  for (let y = 0; y < size; y += 1) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x += 1) {
      const value = (x * 17 + y * 31 + seed) % 7;
      row.push(value < 3);
    }
    matrix.push(row);
  }

  return matrix;
}

export default function TicketsPage() {
  const { pois, reservations, startRide, addTripUsage, returnVehicle } = useExploreStore();
  const { purchasedTickets, markTicketAsUsed, hasDeutschlandticket, pendingOpenTicketId, clearPendingOpenTicket } = useTicketsStore();
  const [manuallySelectedTicket, setManuallySelectedTicket] = useState<TicketDetailsData | null>(null);

  const reservationItems = useMemo(() => {
    return reservations
      .map((reservation) => ({
        reservation,
        poi: pois.find((poi) => poi.id === reservation.poiId) ?? null,
      }))
      .filter((item) => item.poi);
  }, [pois, reservations]);

  const formatEur = (value: number) => `EUR ${value.toFixed(2)}`;
  const deutschlandticketPrice = 58;
  const currentDate = new Date();
  const validFrom = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const validUntil = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const validRangeLabel = `${validFrom.toLocaleDateString("en-GB")} - ${validUntil.toLocaleDateString("en-GB")}`;
  const autoSelectedTicket =
    pendingOpenTicketId === "deutschlandticket" && hasDeutschlandticket
      ? {
          id: "deutschlandticket",
          title: "Deutschlandticket",
          from: "Germany-wide",
          to: "Regional public transport",
          price: deutschlandticketPrice,
          mode: "Regional trains, buses, trams",
          provider: "Deutschlandtarif",
          status: "active",
        }
      : null;

  const selectedTicket = manuallySelectedTicket ?? autoSelectedTicket;

  const qrMatrix = useMemo(
    () => (selectedTicket ? buildQrMatrix(`${selectedTicket.id}-${selectedTicket.from}-${selectedTicket.to}`) : []),
    [selectedTicket],
  );

  const openTicketDetails = (ticket: TicketDetailsData) => {
    clearPendingOpenTicket();
    setManuallySelectedTicket(ticket);
  };

  return (
    <div className="p-4 space-y-4">
      <header>
        <h2 className="text-2xl font-bold">Tickets & Reservations</h2>
        <p className="text-sm text-muted-foreground">Manage reserved vehicles and active trips.</p>
      </header>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Purchased tickets</h3>
        {purchasedTickets.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">No purchased tickets yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {purchasedTickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer" onClick={() => openTicketDetails({
                id: ticket.id,
                title: ticket.title,
                from: ticket.from,
                to: ticket.to,
                price: ticket.price,
                mode: ticket.mode,
                provider: ticket.provider,
                status: ticket.status,
              })}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold leading-tight">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">{ticket.mode} • {ticket.provider}</p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{ticket.status}</span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {ticket.from} {"->"} {ticket.to}
                  </p>
                  <p className="text-sm">
                    Price: <span className="font-medium">{formatEur(ticket.price)}</span>
                  </p>

                  {ticket.status === "purchased" ? (
                    <Button size="sm" className="h-8" onClick={(event) => {
                      event.stopPropagation();
                      markTicketAsUsed(ticket.id);
                    }}>
                      <TicketCheck size={14} /> Mark as used
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {hasDeutschlandticket ? (
          <Card className="cursor-pointer border-primary/40" onClick={() => openTicketDetails({
            id: "deutschlandticket",
            title: "Deutschlandticket",
            from: "Germany-wide",
            to: "Regional public transport",
            price: deutschlandticketPrice,
            mode: "Regional trains, buses, trams",
            provider: "Deutschlandtarif",
            status: "active",
          })}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-tight">Deutschlandticket</p>
                  <p className="text-xs text-muted-foreground">Monthly subscription • {monthLabel}</p>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">active</span>
              </div>
              <p className="text-sm text-muted-foreground">Valid in regional public transport across Germany.</p>
              <p className="text-xs text-muted-foreground">Validity: {validRangeLabel}</p>
              <p className="text-sm">Price: <span className="font-medium">{formatEur(deutschlandticketPrice)}</span></p>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobility reservations</h3>

        {reservationItems.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">No reserved options yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reservationItems.map(({ reservation, poi }) => {
              if (!poi) return null;
              const isActive = reservation.status === "active";
              const isReserved = reservation.status === "reserved";
              const isCompleted = reservation.status === "completed";

              return (
                <Card key={reservation.id}>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="font-semibold leading-tight">{poi.name}</p>
                      <p className="text-xs text-muted-foreground">{poi.provider} • {poi.type}</p>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Status: {reservation.status}</p>
                      <p className="flex items-center gap-1"><Gauge size={13} /> {reservation.distanceKm.toFixed(1)} km</p>
                      <p className="flex items-center gap-1"><Clock3 size={13} /> {reservation.durationMin} min</p>
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Drawer open={!!selectedTicket} onOpenChange={(open) => {
        if (!open) {
          setManuallySelectedTicket(null);
          clearPendingOpenTicket();
        }
      }}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>{selectedTicket?.title}</DrawerTitle>
              <p className="text-sm text-muted-foreground">{selectedTicket?.mode} • {selectedTicket?.provider}</p>
            </DrawerHeader>

            {selectedTicket ? (
              <div className="px-4 pb-2 space-y-4">
                <div className="mx-auto w-fit rounded-lg border bg-white p-2">
                  <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${qrMatrix[0]?.length ?? 21}, minmax(0, 1fr))` }}>
                    {qrMatrix.flatMap((row, y) => row.map((cell, x) => (
                      <span
                        key={`${x}-${y}`}
                        className={cell ? "h-1.5 w-1.5 bg-black" : "h-1.5 w-1.5 bg-white"}
                      />
                    )))}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">From:</span> {selectedTicket.from}</p>
                  <p><span className="text-muted-foreground">To:</span> {selectedTicket.to}</p>
                  <p><span className="text-muted-foreground">Price:</span> {formatEur(selectedTicket.price)}</p>
                  <p><span className="text-muted-foreground">Status:</span> {selectedTicket.status}</p>
                  {selectedTicket.id === "deutschlandticket" ? (
                    <p><span className="text-muted-foreground">Validity:</span> {validRangeLabel}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-2">Ticket ID: {selectedTicket.id}</p>
                </div>
              </div>
            ) : null}

            <DrawerFooter>
              <DrawerClose asChild>
                <Button type="button" className="w-full">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
