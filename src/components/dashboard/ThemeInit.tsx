"use client";

import { useLayoutEffect } from "react";

export default function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const t = localStorage.getItem("stackd-theme");
      if (t && t !== "default") {
        document.documentElement.setAttribute("data-theme", t);
      }
    } catch {}
  }, []);

  return null;
}
