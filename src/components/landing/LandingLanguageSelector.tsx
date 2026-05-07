"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n, type Locale } from "@/lib/i18n";

const LANGUAGES = [
  { id: "en", label: "English", nativeName: "English", flag: "🇺🇸" },
  { id: "vi", label: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { id: "ko", label: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { id: "ja", label: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { id: "zh", label: "Chinese", nativeName: "中文", flag: "🇨🇳" },
] as {
  id: Locale;
  label: string;
  nativeName: string;
  flag: string;
}[];

export function LandingLanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const currentLanguage =
    LANGUAGES.find((language) => language.id === locale) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelectLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative z-[999]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "h-10 px-3 rounded-full border",
          "border-zinc-700 bg-zinc-950 text-zinc-200",
          "flex items-center gap-2",
          "font-mono text-xs",
          "hover:border-lime-500/50 hover:text-zinc-100 transition-colors",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="font-bold uppercase">{currentLanguage.id}</span>
        <span className="hidden md:inline">{currentLanguage.nativeName}</span>
        <i
          className={cn(
            "ri-arrow-down-s-line text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "fixed left-4 right-4 top-20 z-[9999] overflow-hidden rounded-2xl",
            "border border-zinc-700 bg-[#050505]",
            "shadow-[0_30px_120px_rgba(0,0,0,0.95)]",
            "ring-1 ring-white/10",
            "p-2",
            "sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-72",
          )}
        >
          {LANGUAGES.map((language) => {
            const active = language.id === locale;

            return (
              <button
                key={language.id}
                type="button"
                role="menuitem"
                onPointerDown={(event) => {
                  event.preventDefault();
                  handleSelectLocale(language.id);
                }}
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
                  "flex items-center justify-between gap-4",
                  "text-left transition-colors",
                  active
                    ? "bg-lime-400 text-zinc-950"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100",
                )}
              >
                <span className="flex items-center gap-4 min-w-0">
                  <span
                    className={cn(
                      "w-8 shrink-0 font-mono text-xs font-bold uppercase",
                      active ? "text-zinc-950" : "text-zinc-500",
                    )}
                  >
                    {language.id}
                  </span>

                  <span className="min-w-0">
                    <span className="block font-heading font-bold text-base truncate">
                      {language.nativeName}
                    </span>
                    <span
                      className={cn(
                        "block font-mono text-[11px] truncate",
                        active ? "text-zinc-800" : "text-zinc-500",
                      )}
                    >
                      {language.label} · {language.id.toUpperCase()}
                    </span>
                  </span>
                </span>

                {active && <i className="ri-check-line text-base shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
