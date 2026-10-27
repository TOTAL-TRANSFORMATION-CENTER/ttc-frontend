import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Status } from "@/types";

export interface StatusBadgeProps {
  status?: Status | string | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isInactive = status === "INACTIVE";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold tracking-wide",
        isInactive
          ? "bg-red-500/10 text-red-600 border-red-300 dark:border-red-500/30"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30",
        className
      )}
    >
      {status || "ACTIVE"}
    </Badge>
  );
}

export default StatusBadge;
