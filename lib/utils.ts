import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Robustly parse ISO (YYYY-MM-DD), Indian/UK locale (DD-MM-YYYY or DD/MM/YYYY),
 * and standard date strings without timezone shifts or Invalid Date errors.
 */
export function parseDateString(dateString?: string): Date | null {
  if (!dateString || typeof dateString !== "string") return null;
  const trimmed = dateString.trim();
  if (!trimmed) return null;

  // Match ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime()) && date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
      return date;
    }
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    const y = parseInt(dmyMatch[3], 10);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime()) && date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
      return date;
    }
  }

  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Reusable constant function to calculate completed years from any ISO/date string.
 * Used for calculating Age from DOB and Years of Marriage from DOM.
 */
export function calculateYears(dateString?: string): number | "" {
  if (!dateString) return "";
  const targetDate = parseDateString(dateString);
  if (!targetDate) return "";

  const today = new Date();
  let years = today.getFullYear() - targetDate.getFullYear();
  const monthDiff = today.getMonth() - targetDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < targetDate.getDate())) {
    years--;
  }
  return years >= 0 ? years : 0;
}

export const calculateAge = calculateYears;

