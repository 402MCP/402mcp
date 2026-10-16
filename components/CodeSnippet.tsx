"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface CodeSnippetProps {
  code: string;
  /** Shown in the snippet's title bar, e.g. "Install the SDK". */
  label?: string;
  /** Language hint rendered on the right of the title bar. */
  language?: string;
  className?: string;
}

/**
 * A copy-to-clipboard code block. Clipboard access can be denied (insecure
 * origin, permissions policy), so failures fall back to a manual-select hint
 * rather than silently doing nothing.
 */
export function CodeSnippet({
  code,
  label,
  language = "bash",
  className,
}: CodeSnippetProps) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");

  React.useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className={cn("min-w-0 border border-border", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label ?? language}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label ?? "code"} to clipboard`}
          className="border border-transparent px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
        >
          {state === "copied"
            ? "Copied"
            : state === "failed"
              ? "Select & copy"
              : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-[13px] leading-relaxed">
        <code className={`font-mono lang-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

export default CodeSnippet;
