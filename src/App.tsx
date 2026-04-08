// src/App.tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.tsx';
import SearchPage from './features/search/SearchPage.tsx';
import SearchResultsPage from './features/search/SearchResultsPage.tsx';
import ExplorePage from './features/explore/ExplorePage.tsx';
import TicketsPage from './features/tickets/TicketsPage.tsx';
import AccountPage from './features/account/AccountPage.tsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Feature 1: Ride Search */}
          <Route index element={<SearchPage />} />
          <Route path="search/results" element={<SearchResultsPage />} />
          
          {/* Feature 2: Map Explore */}
          <Route path="explore" element={<ExplorePage />} />
          
          {/* Feature 3: Tickets / Reservations */}
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}