"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Guarda la zona horaria del dispositivo en una cookie para que "hoy" sea tu hoy. */
export function TimezoneSync({ current }: { current: string | undefined }) {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== current) {
      document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  }, [current, router]);
  return null;
}
