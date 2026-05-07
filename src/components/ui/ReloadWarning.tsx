"use client";

import { useEffect, useState } from "react";

interface ReloadWarningProps {
  /** Show warning only when user has started typing */
  hasStarted: boolean;
  /** Show preferred difficulty warning (problem may change on reload for ANY) */
  showDifficultyWarning?: boolean;
  problemTitle: string;
}

/**
 * Shows a native beforeunload warning, plus an in-app dialog when the user
 * tries to navigate away via router (back button, nav links).
 *
 * Also shows a one-time info banner warning that reloading may change the
 * problem when preferred difficulty is ANY.
 */
export function useReloadWarning(hasStarted: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasStarted) return;
      e.preventDefault();
      e.returnValue =
        "You have unsaved code. If you reload, your current code will be lost and the problem may change.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasStarted]);
}

/**
 * Banner shown once to warn users with ANY preferred difficulty that reloading
 * may serve a different problem.
 */
export function DifficultyReloadBanner({
  preferredDifficulty,
}: {
  preferredDifficulty: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (preferredDifficulty !== "ANY") return;
    const dismissed = sessionStorage.getItem("grindev_reload_warn_dismissed");
    if (!dismissed) setVisible(true);
  }, [preferredDifficulty]);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem("grindev_reload_warn_dismissed", "1");
    setVisible(false);
  }

  return (
    <div className="px-4 md:px-6 py-2 bg-blue-500/5 border-b border-blue-500/20 flex items-center gap-2 text-xs font-mono text-blue-400">
      <i className="ri-information-line shrink-0" />
      <span className="flex-1">
        Your difficulty is set to <strong>Any</strong> — reloading this page may
        show a different problem and your current code will be lost.
      </span>
      <button
        onClick={dismiss}
        className="text-blue-400/50 hover:text-blue-400 transition-colors shrink-0"
      >
        <i className="ri-close-line" />
      </button>
    </div>
  );
}
