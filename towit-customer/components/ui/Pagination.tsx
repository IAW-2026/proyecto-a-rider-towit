import Link from "next/link"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  basePath: string
  queryParams?: Record<string, string>
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  basePath,
  queryParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null

  function buildUrl(page: number) {
    const params = new URLSearchParams(queryParams)
    if (page > 1) params.set("page", String(page))
    else params.delete("page")
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const pages: (number | "...")[] = []
  const delta = 2
  const left = Math.max(2, currentPage - delta)
  const right = Math.min(totalPages - 1, currentPage + delta)

  pages.push(1)
  if (left > 2) pages.push("...")
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < totalPages - 1) pages.push("...")
  if (totalPages > 1) pages.push(totalPages)

  return (
    <div className="bg-card rounded-xl shadow-xl border border-border overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4">
        <span className="text-sm text-muted-foreground">
          Total: {totalItems} resultado{totalItems !== 1 ? "s" : ""}
        </span>

        <nav aria-label="Paginación" className="flex items-center gap-1.5">
          {currentPage > 1 ? (
            <Link
              href={buildUrl(currentPage - 1)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
              aria-label="Página anterior"
            >
              &lt;
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground/40" aria-disabled="true">
              &lt;
            </span>
          )}

          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <Link
                key={p}
                href={buildUrl(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  p === currentPage
                    ? "bg-brand-yellow text-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                aria-current={p === currentPage ? "page" : undefined}
              >
                {p}
              </Link>
            )
          )}

          {currentPage < totalPages ? (
            <Link
              href={buildUrl(currentPage + 1)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
              aria-label="Página siguiente"
            >
              &gt;
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground/40" aria-disabled="true">
              &gt;
            </span>
          )}
        </nav>
      </div>
    </div>
  )
}
