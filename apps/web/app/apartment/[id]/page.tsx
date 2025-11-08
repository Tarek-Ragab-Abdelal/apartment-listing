'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import ApartmentDetail from "@/page-components/ApartmentDetail";

export default function ApartmentDetailPage() {
  return (
    <ProtectedRoute>
      <ApartmentDetail />
    </ProtectedRoute>
  );
}