"use client";

import CommitteeBlindQueue from "@/components/staff/financial-aid/CommitteeBlindQueue";

export default function ReviewerTasksPage() {
  return <CommitteeBlindQueue statusFilter="pending" portalLabel="New review tasks" />;
}
