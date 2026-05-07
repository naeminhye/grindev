"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface QuizImportButtonProps {
  onImported: () => void;
}

export function QuizImportButton({ onImported }: QuizImportButtonProps) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    titles: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJson(ev.target?.result as string);
    reader.readAsText(file);
  }

  async function handleImport() {
    setError("");
    setResult(null);

    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch {
      setError("Invalid JSON — check your file for syntax errors.");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/admin/quizzes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error),
        );
        return;
      }

      setResult({
        imported: data.imported,
        titles: data.quizzes.map((q: any) => q.title),
      });
      onImported();
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setJson("");
    setError("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 border border-border text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 font-mono text-sm rounded transition-colors"
      >
        <i className="ri-upload-2-line" /> Import JSON
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative bg-zinc-900 border border-border rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <i className="ri-upload-2-line text-lime-400" />
                <h2 className="font-heading font-bold text-base">
                  Import Quiz JSON
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Instructions */}
              <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-400 space-y-1">
                <p className="text-zinc-300 font-bold">Accepted formats:</p>
                <p>
                  • Single quiz object:{" "}
                  <code className="text-lime-300">
                    {'{ "title": "...", "questions": [...] }'}
                  </code>
                </p>
                <p>
                  • Array of quizzes:{" "}
                  <code className="text-lime-300">{"[{ ... }, { ... }]"}</code>
                </p>
                <p className="pt-1">
                  <a
                    href="/api/admin/quizzes/template"
                    className="text-lime-400 hover:underline"
                    download="quiz-template.json"
                  >
                    <i className="ri-download-line mr-1" />
                    Download template
                  </a>
                </p>
              </div>

              {/* File upload */}
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Upload file
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  onChange={handleFile}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-zinc-300 file:font-mono file:text-xs cursor-pointer"
                />
              </div>

              {/* Or paste */}
              <div>
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Or paste JSON
                </label>
                <textarea
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  placeholder='{ "title": "...", "topic": "JAVASCRIPT", ... }'
                  rows={6}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50 resize-y"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs font-mono">
                  <i className="ri-error-warning-line shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Success */}
              {result && (
                <div className="p-3 bg-lime-500/10 border border-lime-500/20 rounded-md text-xs font-mono space-y-1">
                  <p className="text-lime-400 font-bold">
                    <i className="ri-check-line mr-1" />
                    Imported {result.imported} quiz
                    {result.imported !== 1 ? "zes" : ""}
                  </p>
                  {result.titles.map((title, i) => (
                    <p key={i} className="text-zinc-400 pl-4">
                      • {title}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {result ? "Close" : "Cancel"}
              </button>
              {!result && (
                <button
                  onClick={handleImport}
                  disabled={!json.trim() || importing}
                  className="flex items-center gap-2 px-5 py-2 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 disabled:opacity-40 transition-colors"
                >
                  {importing ? (
                    <i className="ri-loader-4-line animate-spin" />
                  ) : (
                    <i className="ri-upload-2-line" />
                  )}
                  Import
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
