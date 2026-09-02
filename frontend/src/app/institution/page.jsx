"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function InstitutionIndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "institution_admin") {
      router.replace("/institution/admin");
      return;
    }
    router.replace("/institution/login");
  }, [user, loading, router]);

  return null;
}
