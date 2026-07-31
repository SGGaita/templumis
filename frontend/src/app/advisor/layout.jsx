"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/** Legacy /advisor URLs → /sponsor */
export default function AdvisorLegacyRedirectLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const target = pathname.replace(/^\/advisor/, "/sponsor");
    router.replace(target || "/sponsor");
  }, [pathname, router]);

  return children;
}
