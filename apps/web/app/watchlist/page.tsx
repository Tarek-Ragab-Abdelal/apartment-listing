'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Watchlist from "@/page-components/Watchlist";

export default function WatchlistPage() {
  return (
    <ProtectedRoute>
      <Watchlist />
    </ProtectedRoute>
  );
}