'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import NewListing from "@/page-components/NewListing";

export default function NewListingPage() {
  return (
    <ProtectedRoute adminOnly>
      <NewListing />
    </ProtectedRoute>
  );
}