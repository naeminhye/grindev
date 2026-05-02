'use client'

import { useRef, useCallback } from 'react'
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  disabled?: boolean
  className?: string
}

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  disabled = false,
  className,
}: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null)

  const handleMount: OnMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco

    // ── Block paste via Monaco's paste event ──────────────────────────
    editor.onDidPaste(() => {
      // Undo the paste immediately
      editor.trigger('keyboard', 'undo', null)

      // Flash a visual warning (optional — handled by parent via onPasteAttempt)
      const domNode = editor.getDomNode()
      if (domNode) {
        domNode.style.outline = '2px solid hsl(0 72% 51%)'
        setTimeout(() => { domNode.style.outline = '' }, 600)
      }
    })

    // ── Block Ctrl+V / Cmd+V at the DOM level (second layer) ──────────
    editor.getDomNode()?.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        e.stopPropagation()
      }
    }, true)

    // ── Disable right-click context menu (no "paste" option) ──────────
    editor.updateOptions({ contextmenu: false })

    // ── Editor config ─────────────────────────────────────────────────
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 1.7,
      fontFamily: '"JetBrains Mono", monospace',
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      renderLineHighlight: 'line',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      padding: { top: 16, bottom: 16 },
      readOnly: disabled,
    })

    // Focus editor on mount
    editor.focus()
  }, [disabled])

  return (
    <div className={cn('rounded-md overflow-hidden border border-border', className)}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          // Base options — extended in onMount
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 14,
          minimap: { enabled: false },
          contextmenu: false,
          readOnly: disabled,
        }}
      />
    </div>
  )
}
