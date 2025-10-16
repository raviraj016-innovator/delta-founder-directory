"use client";

import { useEffect, useState } from "react";

function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const initial = saved ?? getSystemTheme();
    document.documentElement.setAttribute("data-theme", initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setTheme(initial);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const stored = localStorage.getItem("theme");
      if (!stored) {
        const sys = getSystemTheme();
        document.documentElement.setAttribute("data-theme", sys);
        document.documentElement.classList.toggle("dark", sys === "dark");
        setTheme(sys);
      }
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const toggle = () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  if (!theme) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[color:rgb(0_0_0_/_.04)] dark:hover:bg-[color:rgb(255_255_255_/_.06)] transition-colors"
      aria-label="Toggle theme"
    >
      <span className="h-4 w-4 inline-block" aria-hidden>
        {theme === "dark" ? (
          // moon
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 opacity-80"><path d="M21 12.79A9 9 0 1 1 11.21 3c.2 0 .39.12.47.31a.5.5 0 0 1-.13.57 7 7 0 0 0 8.57 8.57.5.5 0 0 1 .57-.13c.19.08.31.27.31.47Z"/></svg>
        ) : (
          // sun
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 opacity-80"><path d="M6.76 4.84 4.96 3.05 3.55 4.46l1.79 1.8 1.42-1.42ZM1 13h3v-2H1v2Zm10 10h2v-3h-2v3Zm9.45-18.54-1.41-1.41-1.8 1.79 1.42 1.42 1.79-1.8ZM17.24 19.16l1.8 1.79 1.41-1.41-1.79-1.8-1.42 1.42ZM20 11v2h3v-2h-3ZM4 11v2h3v-2H4Zm8-7h-2v3h2V4Zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
        )}
      </span>
      <span className="opacity-80">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
