import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Square label chips. Used for factual tags (rank, score, capability), never
 * for decoration, so the variants differ only in weight and fill.
 */
const badgeVariants = cva(
  "inline-flex items-center border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-muted-foreground",
        solid: "border-foreground bg-foreground text-background",
        muted: "border-border bg-muted text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
