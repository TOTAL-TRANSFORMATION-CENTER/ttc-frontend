"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/components/ttc/theme-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  /**
   * Unique identifier for the column or object key to display
   */
  key?: string;
  /**
   * Property name on the row object to access
   */
  accessorKey?: keyof T | string;
  /**
   * Header title or custom header React component. If omitted, derived from accessorKey/key.
   */
  header?: React.ReactNode;
  /**
   * Custom cell renderer function
   */
  cell?: (row: T, index: number) => React.ReactNode;
  /**
   * Custom CSS class applied to the <TableHead>
   */
  headerClassName?: string;
  /**
   * Custom CSS class applied to each <TableCell> in this column
   */
  className?: string;
  /**
   * Cell text alignment
   */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T extends object = Record<string, unknown>> {
  /**
   * The list of items to render
   */
  data: T[];
  /**
   * Optional column definitions. If omitted, columns are dynamically generated from data keys.
   */
  columns?: ColumnDef<T>[];
  /**
   * Whether the table is currently loading
   */
  isLoading?: boolean;
  /**
   * Text shown during loading state
   */
  loadingMessage?: string;
  /**
   * Empty state content shown when data is empty
   */
  emptyMessage?: React.ReactNode;
  /**
   * Optional row click event handler
   */
  onRowClick?: (row: T, index: number) => void;
  /**
   * Function to extract a unique key for each row
   */
  getRowKey?: (row: T, index: number) => string | number;
  /**
   * Custom CSS class for individual rows or function returning className
   */
  rowClassName?: string | ((row: T, index: number) => string);
  /**
   * Custom CSS class for the outermost container card
   */
  className?: string;
  /**
   * Custom CSS class for the <Table> element
   */
  tableClassName?: string;
  /**
   * Custom CSS class for the <TableHeader> element
   */
  headerClassName?: string;
}

/**
 * Format camelCase or snake_case property keys into clean title labels
 */
function formatColumnTitle(key: string): string {
  if (key.toLowerCase() === "id") return "ID";
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Default formatter for raw cell values
 */
function defaultFormatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
          value
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        )}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }
  if (Array.isArray(value)) {
    return `${value.length} items`;
  }
  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Dynamic, theme-aware shadcn DataTable component.
 * Automatically adapts to light, solarised, and dark themes.
 * Can automatically generate columns from any data array or accept custom column definitions.
 */
export function DataTable<T extends object = Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  loadingMessage = "Loading records, please wait...",
  emptyMessage,
  onRowClick,
  getRowKey,
  rowClassName,
  className,
  tableClassName,
  headerClassName,
}: DataTableProps<T>) {
  const { theme } = useTheme();

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  // Derive dynamic columns if no explicit columns provided
  const activeColumns: ColumnDef<T>[] = useMemo(() => {
    if (columns && columns.length > 0) {
      return columns.map((col) => ({
        ...col,
        header:
          col.header ??
          formatColumnTitle(String(col.accessorKey || col.key || "")),
      }));
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Inspect first row keys
    const firstRow = data[0];
    const keys = Object.keys(firstRow).filter(
      (k) => !k.startsWith("_") && k !== "password"
    );

    return keys.map((key) => ({
      key,
      accessorKey: key as keyof T,
      header: formatColumnTitle(key),
      cell: (row: T) => defaultFormatValue((row as Record<string, unknown>)[key]),
    }));
  }, [columns, data]);

  const colSpanCount = Math.max(1, activeColumns.length);

  return (
    <div
      className={cn(
        "rounded-2xl border shadow-xs overflow-hidden transition-colors",
        t(
          "bg-white border-zinc-200",
          "bg-slate-900 border-slate-800",
          "bg-zinc-950 border-zinc-800"
        ),
        className
      )}
    >
      <div className="w-full overflow-x-auto">
        <Table className={tableClassName}>
          <TableHeader className={headerClassName}>
            <TableRow
              className={t(
                "bg-zinc-50 border-zinc-200",
                "bg-slate-800/60 border-slate-800",
                "bg-zinc-900/60 border-zinc-800"
              )}
            >
              {activeColumns.map((col, idx) => {
                const headerAlignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return (
                  <TableHead
                    key={col.key || String(col.accessorKey) || idx}
                    className={cn(
                      "font-bold text-xs select-none tracking-tight",
                      headerAlignClass,
                      col.headerClassName
                    )}
                  >
                    {col.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={colSpanCount} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
                    <p
                      className={cn(
                        "text-sm font-medium",
                        t("text-zinc-600", "text-slate-400", "text-zinc-400")
                      )}
                    >
                      {loadingMessage}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpanCount} className="text-center py-16">
                  {emptyMessage ? (
                    typeof emptyMessage === "string" ? (
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                        <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                          <Inbox className="h-6 w-6" />
                        </div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            t("text-zinc-600", "text-slate-400", "text-zinc-400")
                          )}
                        >
                          {emptyMessage}
                        </p>
                      </div>
                    ) : (
                      emptyMessage
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <p className="text-base font-semibold">No records found</p>
                      <p
                        className={cn(
                          "text-xs",
                          t("text-zinc-500", "text-slate-400", "text-zinc-400")
                        )}
                      >
                        There are currently no rows to display in this table.
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => {
                const rowWithId = row as { id?: string | number; key?: string | number };
                const rowKey = getRowKey
                  ? getRowKey(row, rowIndex)
                  : rowWithId.id ?? rowWithId.key ?? rowIndex;

                const computedRowClassName =
                  typeof rowClassName === "function"
                    ? rowClassName(row, rowIndex)
                    : rowClassName;

                return (
                  <TableRow
                    key={rowKey}
                    onClick={() => onRowClick?.(row, rowIndex)}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer",
                      t(
                        "hover:bg-zinc-50/80 border-zinc-100",
                        "hover:bg-slate-800/40 border-slate-800/60",
                        "hover:bg-zinc-900/40 border-zinc-800/60"
                      ),
                      computedRowClassName
                    )}
                  >
                    {activeColumns.map((col, colIndex) => {
                      const cellAlignClass =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";

                      let content: React.ReactNode;
                      if (col.cell) {
                        content = col.cell(row, rowIndex);
                      } else if (col.accessorKey) {
                        content = defaultFormatValue((row as Record<string, unknown>)[col.accessorKey as string]);
                      } else if (col.key) {
                        content = defaultFormatValue((row as Record<string, unknown>)[col.key]);
                      } else {
                        content = null;
                      }

                      return (
                        <TableCell
                          key={col.key || String(col.accessorKey) || colIndex}
                          className={cn(cellAlignClass, col.className)}
                        >
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataTable;
