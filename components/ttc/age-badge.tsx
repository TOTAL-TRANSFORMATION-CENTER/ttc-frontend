import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AgeBadgeProps {
  age?: number | string | null;
  className?: string;
  showAge?: boolean;
}

export function getAgeCategoryInfo(ageNum: number) {
  if (ageNum < 12) {
    return {
      label: "Child",
      className: "bg-orange-500/10 text-orange-600 border-orange-300",
    };
  }
  if (ageNum < 18) {
    return {
      label: "Pre-Youth",
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-300",
    };
  }
  if (ageNum <= 30) {
    return {
      label: "Youth",
      className: "bg-green-500/10 text-green-600 border-green-300",
    };
  }
  return {
    label: "Adult",
    className: "bg-blue-500/10 text-blue-600 border-blue-300",
  };
}

export function AgeBadge({ age, className, showAge = false }: AgeBadgeProps) {
  const ageNum = typeof age === "number" ? age : age ? Number(age) : null;
  if (ageNum === null || isNaN(ageNum)) return null;

  const { label, className: badgeColor } = getAgeCategoryInfo(ageNum);

  return (
    <div className="inline-flex items-center gap-1.5">
      {showAge && <span className="text-xs font-mono">{ageNum}</span>}
      <Badge
        variant="outline"
        className={cn("text-[10px] font-medium", badgeColor, className)}
      >
        {label}
      </Badge>
    </div>
  );
}

export default AgeBadge;
