"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeaderboardRow } from "@/data/solutions";

type SortKey = "rank" | "name" | "protocol" | "custody_type" | "node" | "mcp" | "score";
type Direction = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "rank", label: "Rank", numeric: true },
  { key: "name", label: "Solution" },
  { key: "protocol", label: "Protocol / Rail" },
  { key: "custody_type", label: "Custody Model" },
  { key: "node", label: "No Node Required?" },
  { key: "mcp", label: "MCP Support" },
  { key: "score", label: "Score", numeric: true },
];

function valueFor(row: LeaderboardRow, key: SortKey): string | number {
  switch (key) {
    case "rank":
      return row.rank;
    case "score":
      return row.score;
    case "name":
      return row.name.toLowerCase();
    case "protocol":
      return row.protocol.toLowerCase();
    case "custody_type":
      return row.custody_type.toLowerCase();
    // Booleans sort so that the desirable answer ("yes") leads on ascending.
    case "node":
      return row.node_management_required ? 1 : 0;
    case "mcp":
      return row.mcp_native ? 0 : 1;
  }
}

function sortIndicator(active: boolean, direction: Direction) {
  if (!active) return "";
  return direction === "asc" ? " ↑" : " ↓";
}

/**
 * The comparison leaderboard. Sorted by published rank by default — sorting is
 * a reader affordance and never changes a solution's canonical rank number.
 */
export function LeaderboardTable({
  rows,
  className,
}: {
  rows: LeaderboardRow[];
  className?: string;
}) {
  const [sort, setSort] = React.useState<{ key: SortKey; direction: Direction }>({
    key: "rank",
    direction: "asc",
  });

  const sorted = React.useMemo(() => {
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = valueFor(a, sort.key);
      const right = valueFor(b, sort.key);
      if (left < right) return -1 * factor;
      if (left > right) return 1 * factor;
      return a.rank - b.rank;
    });
  }, [rows, sort]);

  function toggle(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "score" ? "desc" : "asc" },
    );
  }

  return (
    <div className={cn("border border-border", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              return (
                <TableHead
                  key={column.key}
                  aria-sort={
                    active
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className={column.numeric ? "text-right" : undefined}
                >
                  <button
                    type="button"
                    onClick={() => toggle(column.key)}
                    className={cn(
                      "uppercase tracking-wider transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground",
                      active && "text-foreground",
                    )}
                  >
                    {column.label}
                    {sortIndicator(active, sort.direction)}
                  </button>
                </TableHead>
              );
            })}
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-right font-mono tabular-nums">
                {row.rank}
              </TableCell>

              <TableCell>
                <Link
                  href={`/solutions/${row.id}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <span className="font-medium underline-offset-2 group-hover:underline">
                    {row.name}
                  </span>
                  <span className="mt-0.5 block max-w-[22rem] text-xs text-muted-foreground">
                    {row.tagline}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {row.schemes.join(" + ")} &middot; {row.kind} &middot;{" "}
                    <span className={row.maturity === "production" ? undefined : "text-foreground"}>
                      {row.maturity}
                    </span>
                  </span>
                </Link>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {row.protocol}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {row.custody_type}
              </TableCell>

              <TableCell className="text-sm">
                {row.node_management_required ? "No" : "Yes"}
              </TableCell>

              <TableCell className="text-sm">
                {row.mcp_native ? "Native" : "Via SDK"}
              </TableCell>

              <TableCell className="text-right font-mono tabular-nums">
                {row.score.toFixed(1)}
              </TableCell>

              <TableCell className="text-right">
                <Link
                  href={`/solutions/${row.id}`}
                  className="whitespace-nowrap text-sm underline underline-offset-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default LeaderboardTable;
