import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Not in the registry
      </h1>
      <p className="mt-3 text-muted-foreground">
        That page does not exist. The full list of indexed 402 solutions is on
        the leaderboard, or fetch it as JSON from{" "}
        <a href="/api/v1/solutions" className="link font-mono">
          /api/v1/solutions
        </a>
        .
      </p>
      <Link href="/" className={`mt-8 ${buttonVariants({ variant: "default" })}`}>
        Back to the leaderboard
      </Link>
    </div>
  );
}
