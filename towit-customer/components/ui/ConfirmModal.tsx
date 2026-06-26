"use client";

import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const prevOpen = useRef(open);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setVisible(true);
    } else if (!open && prevOpen.current) {
      setVisible(false);
    }
    prevOpen.current = open;
  }, [open]);

  const show = open || visible;

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [show, onCancel]);

  return (
    <div
      role="presentation"
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ease-out ${
        visible ? "bg-black/60 backdrop-blur-sm" : "bg-transparent pointer-events-none"
      }`}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Confirmar"}
        onClick={(e) => e.stopPropagation()}
        className={`mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border transition-all duration-250 ease-out ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"
        }`}
      >
        <div className="flex flex-col items-center px-6 pb-2 pt-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-900/30">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6 text-red-400" />
          </div>
          {title && <h3 className="mb-1 text-[17px] font-bold text-foreground">{title}</h3>}
          <p className="text-[13px] text-muted-foreground">{message}</p>
        </div>
        <div className="flex gap-2 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-border bg-card py-3 text-[13px] font-semibold text-muted-foreground transition active:bg-muted disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-700 py-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-red-600 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
