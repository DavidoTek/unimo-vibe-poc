// src/layouts/MainLayout.tsx
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Map as MapIcon, Ticket, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import SearchPage from '@/features/search/SearchPage';
import SearchResultsPage from '@/features/search/SearchResultsPage';
import ExplorePage from '@/features/explore/ExplorePage';
import AccountPage from '@/features/account/AccountPage';
import { useExploreStore } from '@/features/explore/model/store';
import { useTicketsStore } from '@/features/tickets/model/ticketsStore';

const navItems = [
  { label: 'Search', path: '/', icon: Search },
  { label: 'Explore', path: '/explore', icon: MapIcon },
  { label: 'Tickets', path: '/tickets', icon: Ticket },
  { label: 'Account', path: '/account', icon: User },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSearchResultsPage = pathname.startsWith('/search/results');
  const isAccountDesktopOverlay = pathname === '/account';
  const showDesktopMapPane = pathname === '/' || pathname.startsWith('/search') || pathname === '/explore' || pathname === '/account';
  const reservations = useExploreStore((state) => state.reservations);
  const purchasedTickets = useTicketsStore((state) => state.purchasedTickets);

  const activeTripCount = reservations.filter((reservation) => reservation.status === 'active').length;
  const reservedCount = reservations.filter((reservation) => reservation.status === 'reserved').length;
  const purchasedTicketCount = purchasedTickets.filter((ticket) => ticket.status === 'purchased').length;
  const ticketsAttentionCount = activeTripCount + reservedCount + purchasedTicketCount;

  const isNavItemActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname.startsWith('/search');
    }

    return pathname === path;
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden h-full md:flex relative">
        <Link
          to="/account"
          className="absolute top-4 right-5 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/95 backdrop-blur text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Open account"
          title="Account"
        >
          <User size={16} />
        </Link>

        <aside className="flex w-[450px] flex-col border-r bg-background z-20 shadow-xl overflow-hidden">
          <div className="p-6 pb-2">
            <h1 className="text-2xl font-black text-primary tracking-tighter italic">unimo</h1>
          </div>
          <div className="px-6 pb-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Universal Mobility</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isSearchResultsPage ? <SearchResultsPage /> : <SearchPage />}
          </div>
        </aside>

        <main className="flex-1 h-full overflow-hidden relative">
          {showDesktopMapPane ? <ExplorePage /> : <Outlet />}

          {isAccountDesktopOverlay ? (
            <div
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 backdrop-blur-[1px]"
              onClick={() => navigate('/explore')}
            >
              <div
                className="h-[90%] w-[90%] overflow-hidden rounded-2xl border border-border/70 bg-background shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="h-full overflow-y-auto">
                  <AccountPage />
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="flex h-full flex-col md:hidden">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <nav className="h-16 border-t bg-card flex items-center justify-around shrink-0 z-20">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 flex-1',
                isNavItemActive(item.path)
                  ? 'text-primary'
                  : item.path === '/tickets' && activeTripCount > 0
                    ? 'text-emerald-600'
                    : item.path === '/tickets' && reservedCount > 0
                      ? 'text-amber-600'
                      : item.path === '/tickets' && purchasedTicketCount > 0
                        ? 'text-sky-600'
                      : 'text-muted-foreground'
              )}
            >
              <span className="relative">
                <item.icon size={20} />
                {item.path === '/tickets' && ticketsAttentionCount > 0 ? (
                  <span className="absolute -top-2 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                    {ticketsAttentionCount}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}