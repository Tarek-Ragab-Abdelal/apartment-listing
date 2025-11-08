'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import ConversationDetail from "@/page-components/ConversationDetail";

export default function ConversationDetailPage() {
  return (
    <ProtectedRoute>
      <ConversationDetail />
    </ProtectedRoute>
  );
}