"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ToastData = {
  id: string;
  message: string;
  icon?: string;
  variant?: "success" | "info" | "warning";
  duration?: number;
};

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const show = setTimeout(() => setVisible(true), 10);
    // Auto dismiss
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration ?? 3000);

    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [toast, onDismiss]);

  const config = {
    success: {
      border: "border-lime-500/30 bg-lime-500/10",
      icon: toast.icon ?? "ri-check-line",
      color: "text-lime-400",
    },
    info: {
      border: "border-blue-500/30 bg-blue-500/10",
      icon: toast.icon ?? "ri-information-line",
      color: "text-blue-400",
    },
    warning: {
      border: "border-yellow-500/30 bg-yellow-500/10",
      icon: toast.icon ?? "ri-star-fill",
      color: "text-yellow-400",
    },
  }[toast.variant ?? "info"];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-md border shadow-lg font-mono text-sm",
        "transition-all duration-300",
        config.border,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      )}
    >
      <i className={cn(config.icon, config.color, "text-base shrink-0")} />
      <span className="text-zinc-200">{toast.message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="text-zinc-600 hover:text-zinc-400 transition-colors ml-1"
      >
        <i className="ri-close-line text-sm" />
      </button>
    </div>
  );
}

// ── Global toast store ────────────────────────────────────────────────────────

let addToastFn: ((toast: Omit<ToastData, "id">) => void) | null = null;

export function toast(data: Omit<ToastData, "id">) {
  addToastFn?.(data);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (data) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...data, id }]);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
