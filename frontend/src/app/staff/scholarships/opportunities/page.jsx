"use client";

import OpportunitiesTable from "@/components/staff/financial-aid/OpportunitiesTable";

export default function ScholarshipOpportunitiesPage() {
  return (
    <OpportunitiesTable
      kind="scholarship"
      title="Scholarship opportunities"
      configurePath="/staff/scholarships/configure"
    />
  );
}
