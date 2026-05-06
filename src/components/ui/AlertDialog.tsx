"use client";

import { cn } from "@/lib/utils";

interface AlertDialogProps {
  title: string;
  message: string;
  variant?: "info" | "success" | "danger";
  onClose: () => void;
}

export function AlertDialog({
  title,
  message,
  variant = "info",
  onClose,
}: AlertDialogProps) {
  const config = {
    info: {
      icon: "ri-information-line",
      color: "text-blue-400",
      bar: "bg-blue-500",
      btn: "bg-blue-500 hover:bg-blue-400",
    },
    success: {
      icon: "ri-checkbox-circle-line",
      color: "text-lime-400",
      bar: "bg-lime-400",
      btn: "bg-lime-400 hover:bg-lime-300 text-zinc-950",
    },
    danger: {
      icon: "ri-error-warning-line",
      color: "text-red-400",
      bar: "bg-red-500",
      btn: "bg-red-500 hover:bg-red-400",
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-border rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={cn("h-0.5 w-full", config.bar)} />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-zinc-800",
              )}
            >
              <i className={cn(config.icon, config.color, "text-base")} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-sm text-foreground">
                {title}
              </h3>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              autoFocus
              className={cn(
                "px-4 py-2 text-xs font-mono font-bold rounded transition-colors",
                config.btn,
              )}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
