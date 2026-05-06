"use client";

import { useRef, useCallback, useEffect } from "react";
import Editor, { type OnMount, type Monaco } from "@monaco-editor/react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  disabled?: boolean;
  pasteBlocked?: boolean;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  disabled = false,
  pasteBlocked = true,
  className,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMount: OnMount = useCallback(
    (editor, monaco: Monaco) => {
      editorRef.current = editor;

      if (pasteBlocked) {
        editor.onDidPaste(() => {
          editor.trigger("keyboard", "undo", null);

          const domNode = editor.getDomNode();

          if (domNode) {
            domNode.style.outline = "2px solid hsl(0 72% 51% / 0.8)";

            setTimeout(() => {
              domNode.style.outline = "";
            }, 600);
          }
        });
      }

      editor.getDomNode()?.addEventListener(
        "keydown",
        (e: KeyboardEvent) => {
          if (pasteBlocked && (e.ctrlKey || e.metaKey) && e.key === "v") {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true,
      );

      editor.updateOptions({
        contextmenu: !pasteBlocked,
        fontSize: 14,
        lineHeight: 1.7,
        fontFamily: '"JetBrains Mono", monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        insertSpaces: true,
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        padding: { top: 16, bottom: 16 },
        readOnly: disabled,
        automaticLayout: true,
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
          useShadows: false,
        },
      });

      editor.focus();

      requestAnimationFrame(() => {
        editor.layout();
      });
    },
    [disabled, pasteBlocked],
  );

  useEffect(() => {
    const container = containerRef.current;
    const editor = editorRef.current;

    if (!container || !editor) return;

    const resizeObserver = new ResizeObserver(() => {
      editor.layout();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full min-h-0 w-full rounded-md overflow-hidden border border-border",
        className,
      )}
    >
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 14,
          minimap: { enabled: false },
          contextmenu: !pasteBlocked,
          readOnly: disabled,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
