"use client";

import CommitteeBlindQueue from "@/components/staff/financial-aid/CommitteeBlindQueue";

export default function ReviewerHistoryPage() {
  return <CommitteeBlindQueue statusFilter="completed" portalLabel="My reviews" readOnly />;
}
