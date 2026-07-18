import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
  mobileLabel?: string;
}

interface PlatformTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function PlatformTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = "Nenhum registro encontrado.",
}: PlatformTableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-soft md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-background-soft text-xs uppercase tracking-wide text-text-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={cn("px-4 py-3 font-semibold", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  "border-b border-border last:border-0",
                  onRowClick && "cursor-pointer hover:bg-background-purple-soft/40",
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {data.map((row) => (
          <article
            key={keyExtractor(row)}
            className={cn(
              "rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-soft",
              onRowClick && "cursor-pointer active:bg-background-soft",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") onRowClick(row);
                  }
                : undefined
            }
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
          >
            <dl className="space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between gap-3 text-sm">
                  <dt className="text-text-muted">{col.mobileLabel ?? col.header}</dt>
                  <dd className="text-right font-medium text-text-primary">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
