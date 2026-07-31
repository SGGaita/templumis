"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScholarshipsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/staff/scholarships/applications");
  }, [router]);
  return null;
}
