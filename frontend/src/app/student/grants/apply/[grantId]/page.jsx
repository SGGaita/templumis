"use client";

import { useParams } from "next/navigation";
import GrantApplicationWorkspace from "@/components/grants/GrantApplicationWorkspace";

export default function GrantApplyPage() {
  const params = useParams();
  const grantId = decodeURIComponent(params.grantId || "");

  return (
    <GrantApplicationWorkspace
      grantId={grantId}
      backHref="/student/grants/opportunities"
      backLabel="Back to opportunities"
    />
  );
}
