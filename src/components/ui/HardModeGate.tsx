"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

interface HardModeGateProps {
  problemTitle: string;
  onStart: () => void;
}

export function HardModeGate({ problemTitle, onStart }: HardModeGateProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Blurred backdrop — prevents reading the problem behind */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      <div className="relative bg-zinc-900 border border-orange-500/30 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1 bg-orange-400 w-full" />

        <div className="p-6 space-y-5">
          {/* Icon + title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto">
              <i className="ri-sword-line text-orange-400 text-3xl" />
            </div>

            <div>
              <h2 className="font-heading font-bold text-xl tracking-tight">
                {t("today.hardModeGate.title")}
              </h2>
              <p className="text-sm font-mono text-zinc-400 mt-1">
                "{problemTitle}"
              </p>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2 p-4 bg-zinc-800 rounded-md border border-zinc-700">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
              {t("today.hardModeGate.rulesTitle")}
            </p>

            <div className="space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex items-start gap-2">
                <i className="ri-time-line text-orange-400 mt-0.5 shrink-0" />
                <span>{t("today.hardModeGate.rules.timer")}</span>
              </div>

              <div className="flex items-start gap-2">
                <i className="ri-forbid-2-line text-red-400 mt-0.5 shrink-0" />
                <span>{t("today.hardModeGate.rules.noPaste")}</span>
              </div>

              <div className="flex items-start gap-2">
                <i className="ri-star-fill text-yellow-400 mt-0.5 shrink-0" />
                <span>{t("today.hardModeGate.rules.stars")}</span>
              </div>

              <div className="flex items-start gap-2">
                <i className="ri-lock-line text-zinc-500 mt-0.5 shrink-0" />
                <span>{t("today.hardModeGate.rules.locked")}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="flex-1 py-2.5 border border-border text-sm font-mono text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 rounded transition-colors"
            >
              <i className="ri-settings-3-line mr-1.5" />
              {t("today.hardModeGate.changeMode")}
            </button>

            <button
              type="button"
              onClick={onStart}
              className="flex-1 py-2.5 bg-orange-400 text-zinc-950 font-mono font-bold text-sm rounded hover:bg-orange-300 active:scale-95 transition-all"
            >
              <i className="ri-play-fill mr-1.5" />
              {t("today.hardModeGate.startTimer")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
