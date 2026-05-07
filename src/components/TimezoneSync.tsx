"use client";

import { useEffect } from "react";

/**
 * Sets a cookie with the user's local timezone on mount.
 * The daily API route reads this to determine "today" correctly.
 */
export function TimezoneSync() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=86400; SameSite=Lax`;
      }
    } catch {
      // Ignore — falls back to UTC
    }
  }, []);

  return null;
}
