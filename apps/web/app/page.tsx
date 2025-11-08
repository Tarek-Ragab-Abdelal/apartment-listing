'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import ApartmentList from "@/page-components/ApartmentList";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <ApartmentList />
    </ProtectedRoute>
  );
}