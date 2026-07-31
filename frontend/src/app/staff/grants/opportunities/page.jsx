"use client";

import OpportunitiesTable from "@/components/staff/financial-aid/OpportunitiesTable";

export default function GrantOpportunitiesPage() {
  return (
    <OpportunitiesTable
      kind="grant"
      title="Grant opportunities"
      configurePath="/staff/grants/configure"
    />
  );
}
