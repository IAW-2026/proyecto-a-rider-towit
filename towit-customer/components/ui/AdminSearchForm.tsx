"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

interface AdminSearchFormProps {
  basePath: string;
  initialQuery?: string;
  initialFrom?: string;
  initialTo?: string;
  placeholder?: string;
  showDateRange?: boolean;
}

export default function AdminSearchForm({
  basePath,
  initialQuery = "",
  initialFrom = "",
  initialTo = "",
  placeholder = "Buscar...",
  showDateRange = false,
}: AdminSearchFormProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (showDateRange) {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function handleClear() {
    setQ("");
    setFrom("");
    setTo("");
    router.push(basePath);
  }

  const searchInput = (
    <div className="relative max-w-md">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-10 border-2 border-border rounded-xl text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-foreground bg-card"
      />
      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      {showDateRange ? (
        <div className="flex flex-col md:flex-row gap-3">
          {searchInput}
          <div className="flex gap-3 items-center">
            <label className="text-sm text-muted-foreground font-medium shrink-0">Desde:</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-3 border-2 border-border rounded-xl text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-foreground bg-card w-full md:w-auto"
            />
            <label className="text-sm text-muted-foreground font-medium shrink-0">Hasta:</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-3 border-2 border-border rounded-xl text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-foreground bg-card w-full md:w-auto"
            />
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-3 text-sm text-muted-foreground font-semibold hover:text-foreground transition shrink-0 cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </div>
      ) : (
        searchInput
      )}
    </form>
  );
}
