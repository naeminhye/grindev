"use client";

import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-zinc-900 border border-border rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
        <div
          className={cn(
            "h-0.5 w-full",
            variant === "danger" ? "bg-red-500" : "bg-yellow-500",
          )}
        />

        <div className="p-6 space-y-4">
          {/* Icon + title */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                variant === "danger" ? "bg-red-500/10" : "bg-yellow-500/10",
              )}
            >
              <i
                className={cn(
                  "text-base",
                  variant === "danger"
                    ? "ri-delete-bin-line text-red-400"
                    : "ri-error-warning-line text-yellow-400",
                )}
              />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-sm text-foreground">
                {title}
              </h3>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              autoFocus
              className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-border hover:border-zinc-600 rounded transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "px-4 py-2 text-xs font-mono font-bold rounded transition-colors",
                variant === "danger"
                  ? "bg-red-500 hover:bg-red-400 text-white"
                  : "bg-yellow-500 hover:bg-yellow-400 text-zinc-950",
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
