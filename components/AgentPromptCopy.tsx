"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { CodeSnippet } from "@/components/CodeSnippet";

const MCP_URL = "https://402mcp.org/api/v1/mcp";

const REMOTE_CONFIG = `{
  "mcpServers": {
    "402mcp": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;

const CURSOR_CONFIG = `{
  "mcpServers": {
    "402mcp": { "url": "${MCP_URL}" }
  }
}`;

const VSCODE_CONFIG = `{
  "servers": {
    "402mcp": { "type": "http", "url": "${MCP_URL}" }
  }
}`;

const CLAUDE_CODE_COMMAND = `claude mcp add --transport http 402mcp ${MCP_URL}`;

/** Cursor deeplink: base64 of the server config, name passed separately. */
const CURSOR_DEEPLINK = `cursor://anysphere.cursor-deeplink/mcp/install?name=402mcp&config=${
  typeof btoa === "function" ? btoa(JSON.stringify({ url: MCP_URL })) : ""
}`;

/** VS Code deeplink: URL-encoded JSON including the server name. */
const VSCODE_DEEPLINK = `vscode:mcp/install?${encodeURIComponent(
  JSON.stringify({ name: "402mcp", type: "http", url: MCP_URL }),
)}`;

/**
 * Points the agent at the registry and asks it to compare, rather than naming
 * a winner up front. The registry supplies the data; the choice belongs to
 * whoever is integrating.
 */
const AGENT_PROMPT = `Read https://402mcp.org/llms.txt, then fetch
https://402mcp.org/api/v1/registry for the full dataset.

Compare the indexed HTTP 402 payment solutions against this project's
requirements — custody model, operational overhead, settlement asset,
payment sizes, and whether we need native MCP support — and tell me
which one fits, with your reasoning and the trade-offs I am accepting.

Then implement it.`;

type TabId = "claude-code" | "cursor" | "vscode" | "claude-desktop" | "any" | "prompt";

const TABS: { id: TabId; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "vscode", label: "VS Code" },
  { id: "claude-desktop", label: "Claude Desktop" },
  { id: "any", label: "Any client" },
  { id: "prompt", label: "Agent prompt" },
];

/**
 * Install 402MCP into whatever the reader uses: one-click deeplinks where the
 * client supports them, copyable config everywhere else.
 */
export function AgentPromptCopy({
  className,
  mcpbPath = "/downloads/402mcp.mcpb",
}: {
  className?: string;
  mcpbPath?: string;
}) {
  const [tab, setTab] = React.useState<TabId>("claude-code");

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      <div role="tablist" aria-label="Install in" className="flex flex-wrap border border-border">
        {TABS.map(({ id, label }, index) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground",
              index > 0 && "border-l border-border",
              tab === id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" hidden={tab !== "claude-code"}>
        <CodeSnippet code={CLAUDE_CODE_COMMAND} label="terminal" language="bash" />
      </div>

      <div role="tabpanel" hidden={tab !== "cursor"}>
        <div className="space-y-3">
          <a href={CURSOR_DEEPLINK} className={buttonVariants({ variant: "default", size: "sm" })}>
            Add to Cursor
          </a>
          <CodeSnippet code={CURSOR_CONFIG} label="or paste into ~/.cursor/mcp.json" language="json" />
        </div>
      </div>

      <div role="tabpanel" hidden={tab !== "vscode"}>
        <div className="space-y-3">
          <a href={VSCODE_DEEPLINK} className={buttonVariants({ variant: "default", size: "sm" })}>
            Install in VS Code
          </a>
          <CodeSnippet code={VSCODE_CONFIG} label="or paste into .vscode/mcp.json" language="json" />
        </div>
      </div>

      <div role="tabpanel" hidden={tab !== "claude-desktop"}>
        <div className="space-y-3">
          <a href={mcpbPath} download className={buttonVariants({ variant: "default", size: "sm" })}>
            Download 402mcp.mcpb
          </a>
          <p className="text-sm text-muted-foreground">
            Open the downloaded file to install it as a Claude Desktop extension. It runs locally, so
            probing and decoding happen on your machine. Alternatively, add a custom connector in
            Settings → Connectors with the URL <code className="font-mono text-foreground">{MCP_URL}</code>.
          </p>
        </div>
      </div>

      <div role="tabpanel" hidden={tab !== "any"}>
        <div className="space-y-3">
          <CodeSnippet code={MCP_URL} label="remote MCP server URL (streamable HTTP)" language="text" />
          <CodeSnippet code={REMOTE_CONFIG} label="mcp.json" language="json" />
        </div>
      </div>

      <div role="tabpanel" hidden={tab !== "prompt"}>
        <CodeSnippet code={AGENT_PROMPT} label="prompt for your coding agent" language="text" />
      </div>
    </div>
  );
}

/**
 * Hero action: copies the remote MCP server config so a reader can paste it
 * into any client without scrolling.
 */
export function CopyMcpConfigButton({ className }: { className?: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      variant="outline"
      size="lg"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(REMOTE_CONFIG);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Config copied" : "Copy MCP server config"}
    </Button>
  );
}

export default AgentPromptCopy;
