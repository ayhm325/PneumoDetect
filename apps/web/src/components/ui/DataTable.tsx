import React from "react";
import { EmptyState, ErrorState } from "./StateViews";
import { Skeleton } from "./Skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "start" | "center" | "end";
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRowCount?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription,
  skeletonRowCount = 5,
  className = "",
}: DataTableProps<T>) {
  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (!isLoading && data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const getAlignClass = (align?: "start" | "center" | "end") => {
    if (align === "center") return "text-center";
    if (align === "end") return "text-end";
    return "text-start";
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] shadow-[var(--shadow-card)] transition-all ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--ui-border)] text-start text-sm">
          <thead className="bg-[var(--ui-surface-2)]/80 text-xs font-bold uppercase tracking-wider text-[var(--ui-muted-foreground)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`h-11 px-4 py-3 whitespace-nowrap ${getAlignClass(col.align)} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ui-border)]">
            {isLoading
              ? Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                  <tr key={`skeleton-row-${rIdx}`} className="h-14">
                    {columns.map((col, cIdx) => (
                      <td key={`skeleton-col-${cIdx}`} className="px-4 py-3.5">
                        <Skeleton
                          variant="text"
                          className={cIdx === 0 ? "h-4 w-3/4" : "h-4 w-1/2"}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row, idx) => (
                  <tr
                    key={rowKey(row, idx)}
                    className="transition-colors duration-150 hover:bg-[var(--ui-surface-2)]/60 focus-within:bg-[var(--ui-surface-2)]/60"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`whitespace-nowrap px-4 py-3.5 text-[var(--ui-foreground)] leading-normal ${getAlignClass(col.align)} ${col.className || ""}`}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
