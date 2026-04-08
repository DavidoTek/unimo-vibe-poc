import { create } from "zustand";

export type PurchasedTicket = {
  id: string;
  routeId: string;
  title: string;
  mode: string;
  from: string;
  to: string;
  price: number;
  currency: "EUR";
  purchasedAt: number;
  status: "purchased" | "used" | "refunded";
  provider: string;
  backendPurchaseRef?: string;
};

type TicketPurchaseInput = {
  routeId: string;
  title: string;
  mode: string;
  from: string;
  to: string;
  price: number;
  provider: string;
};

type TicketsState = {
  purchasedTickets: PurchasedTicket[];
  hasDeutschlandticket: boolean;
  pendingOpenTicketId: string | null;
  buyTicket: (input: TicketPurchaseInput) => PurchasedTicket;
  markTicketAsUsed: (ticketId: string) => void;
  toggleDeutschlandticket: () => void;
  requestOpenTicket: (ticketId: string) => void;
  clearPendingOpenTicket: () => void;
};

export const useTicketsStore = create<TicketsState>((set) => ({
  purchasedTickets: [],
  hasDeutschlandticket: true,
  pendingOpenTicketId: null,
  buyTicket: (input) => {
    const ticket: PurchasedTicket = {
      id: `tkt-${Math.random().toString(36).slice(2, 10)}`,
      routeId: input.routeId,
      title: input.title,
      mode: input.mode,
      from: input.from,
      to: input.to,
      price: input.price,
      currency: "EUR",
      purchasedAt: Date.now(),
      status: "purchased",
      provider: input.provider,
    };

    set((state) => ({
      purchasedTickets: [ticket, ...state.purchasedTickets],
    }));

    return ticket;
  },
  markTicketAsUsed: (ticketId) => {
    set((state) => ({
      purchasedTickets: state.purchasedTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: "used" } : ticket,
      ),
    }));
  },
  toggleDeutschlandticket: () => {
    set((state) => ({ hasDeutschlandticket: !state.hasDeutschlandticket }));
  },
  requestOpenTicket: (ticketId) => {
    set({ pendingOpenTicketId: ticketId });
  },
  clearPendingOpenTicket: () => {
    set({ pendingOpenTicketId: null });
  },
}));
