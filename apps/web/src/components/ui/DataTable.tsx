import React from "react";
import { EmptyState, ErrorState, LoadingState } from "./StateViews";

export interface DataTableColumn<T> {
  key: string;
  header: string;
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
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={errorMessage} onRetry={onRetry} />;
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--ui-border)] text-start text-sm">
          <thead className="bg-[var(--ui-surface-2)] text-xs font-semibold uppercase tracking-wider text-[var(--ui-muted)]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 text-start ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ui-border)]">
            {data.map((row, idx) => (
              <tr
                key={rowKey(row, idx)}
                className="transition hover:bg-[var(--ui-surface-2)]/60"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-4 py-3 text-[var(--ui-foreground)] ${col.className || ""}`}
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
