"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GrantsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/staff/grants/applications");
  }, [router]);
  return null;
}
