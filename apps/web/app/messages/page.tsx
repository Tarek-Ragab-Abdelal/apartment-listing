'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Messages from "@/page-components/Messages";

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Messages />
    </ProtectedRoute>
  );
}