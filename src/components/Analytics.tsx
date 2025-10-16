"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_MEASUREMENT_ID;

type Gtag = (command: "config", targetId: string, config?: { page_path?: string }) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;
    if (typeof window === "undefined") return;
    if (!window.gtag) return;
    const page_path = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname || "/";
    window.gtag("config", GA_ID, { page_path });
  }, [pathname, searchParams]);

  return null;
}
