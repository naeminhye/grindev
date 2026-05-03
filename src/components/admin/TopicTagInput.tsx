"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const ALL_TOPICS = [
  "ARRAYS",
  "STRINGS",
  "LINKED_LISTS",
  "TREES",
  "GRAPHS",
  "DYNAMIC_PROGRAMMING",
  "SORTING",
  "BINARY_SEARCH",
  "STACK_QUEUE",
  "HASH_MAP",
  "HEAPS",
  "TWO_POINTERS",
  "SLIDING_WINDOW",
  "DFS_BFS",
  "BACKTRACKING",
  "GREEDY",
  "RECURSION",
  "DIVIDE_AND_CONQUER",
  "BIT_MANIPULATION",
  "MATH",
  "TRIE",
  "UNION_FIND",
  "SEGMENT_TREE",
  "FENWICK_TREE",
  "MONOTONIC_STACK",
  "MONOTONIC_QUEUE",
];

interface TopicTagInputProps {
  value: string[];
  onChange: (topics: string[]) => void;
}

export function TopicTagInput({ value, onChange }: TopicTagInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = ALL_TOPICS.filter(
    (t) =>
      !value.includes(t) &&
      t.toLowerCase().replace(/_/g, " ").includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function add(topic: string) {
    onChange([...value, topic]);
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(topic: string) {
    onChange(value.filter((t) => t !== topic));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" && query === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      add(filtered[0]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Tag input box */}
      <div
        className={cn(
          "flex flex-wrap gap-1.5 min-h-[42px] px-2.5 py-2 bg-zinc-800 border rounded-md cursor-text transition-colors",
          open ? "border-lime-500/50" : "border-zinc-700",
        )}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Selected tags */}
        {value.map((topic) => (
          <span
            key={topic}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lime-400/10 border border-lime-500/30 text-lime-400 text-xs font-mono"
          >
            {topic.replace(/_/g, " ")}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(topic);
              }}
              className="text-lime-600 hover:text-lime-300 transition-colors ml-0.5"
            >
              <i className="ri-close-line text-xs" />
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Search topics..." : ""}
          className="flex-1 min-w-[120px] bg-transparent text-xs font-mono text-zinc-200 outline-none placeholder:text-zinc-600"
        />
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((topic) => (
            <button
              key={topic}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(topic);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors text-left"
            >
              <i className="ri-hashtag text-zinc-600" />
              {topic.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-md p-3">
          <p className="text-xs font-mono text-zinc-600">No matching topics.</p>
        </div>
      )}
    </div>
  );
}
