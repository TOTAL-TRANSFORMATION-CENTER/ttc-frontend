"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type BannerVariant = "error" | "warning" | "success" | "info";

export interface BannerAlertProps {
  variant?: BannerVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function BannerAlert({
  variant = "error",
  title,
  message,
  onClose,
  action,
  className,
}: BannerAlertProps) {
  if (!message) return null;

  const variantStyles = {
    error: {
      container:
        "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300 dark:border-red-500/30",
      icon: "text-red-600 dark:text-red-400",
      titleColor: "text-red-900 dark:text-red-200",
      button: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
      IconComponent: AlertCircle,
    },
    warning: {
      container:
        "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 dark:border-amber-500/30",
      icon: "text-amber-600 dark:text-amber-400",
      titleColor: "text-amber-900 dark:text-amber-200",
      button: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs",
      IconComponent: AlertTriangle,
    },
    success: {
      container:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 dark:border-emerald-500/30",
      icon: "text-emerald-600 dark:text-emerald-400",
      titleColor: "text-emerald-900 dark:text-emerald-200",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
      IconComponent: CheckCircle2,
    },
    info: {
      container:
        "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300 dark:border-blue-500/30",
      icon: "text-blue-600 dark:text-blue-400",
      titleColor: "text-blue-900 dark:text-blue-200",
      button: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
      IconComponent: Info,
    },
  }[variant];

  const { IconComponent } = variantStyles;

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-2xl border shadow-sm backdrop-blur-xs transition-all animate-in fade-in slide-in-from-top-1 duration-200",
        variantStyles.container,
        className
      )}
    >
      <IconComponent className={cn("h-5 w-5 shrink-0 mt-0.5", variantStyles.icon)} />

      <div className="flex-1 min-w-0 pr-6">
        {title && (
          <h4 className={cn("text-sm font-bold tracking-tight mb-0.5", variantStyles.titleColor)}>
            {title}
          </h4>
        )}
        <p className="text-xs font-medium leading-relaxed">{message}</p>

        {action && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={action.onClick}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 cursor-pointer",
                variantStyles.button
              )}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss banner"
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
