"use client";

import { LANGUAGES } from "@/lib/languages";
import type { Language } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  value,
  onChange,
  disabled,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.id === value) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono transition-colors",
          disabled
            ? "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500",
        )}
      >
        <i className="ri-code-s-slash-line text-lime-400" />
        {current.label}
        {!disabled && (
          <i
            className={cn(
              "ri-arrow-down-s-line transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl overflow-hidden min-w-[140px]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                onChange(lang.id);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-left transition-colors",
                lang.id === value
                  ? "bg-lime-400/10 text-lime-400"
                  : "text-zinc-300 hover:bg-zinc-800",
              )}
            >
              {lang.id === value && (
                <i className="ri-check-line text-lime-400" />
              )}
              {lang.id !== value && <span className="w-4" />}
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
