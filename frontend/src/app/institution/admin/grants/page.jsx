"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import { useAuth } from "@/lib/auth-context";
import InstitutionAdminLayout from "@/components/InstitutionAdminLayout";
import ApplicationsTable from "@/components/staff/financial-aid/ApplicationsTable";

export default function InstitutionGrantApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "institution_admin") {
      router.push("/institution/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <InstitutionAdminLayout>
        <LinearProgress sx={{ borderRadius: 1 }} />
      </InstitutionAdminLayout>
    );
  }

  if (!user || user.role !== "institution_admin") return null;

  return (
    <InstitutionAdminLayout>
      <Alert severity="info" sx={{ mb: 2 }}>
        Read-only view of postgraduate grant applications. Financial Aid Officers approve and disburse awards from the staff portal.
      </Alert>
      <ApplicationsTable kind="grant" title="Grant applications" nameField="grant_name" readOnly />
    </InstitutionAdminLayout>
  );
}
