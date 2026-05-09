import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  emoji?: string;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  emoji = "⚠️",
  title,
  body,
  confirmLabel,
  cancelLabel,
  confirmDanger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Make everything outside the modal unreachable by keyboard
    const root = document.getElementById("root");
    root?.setAttribute("inert", "");

    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialog.querySelector<HTMLElement>("button")?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      root?.removeAttribute("inert");
      previouslyFocused?.focus();
    };
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-3xl mb-3" aria-hidden="true">{emoji}</div>
          <h3 id="confirm-modal-title" className="font-black text-[17px] text-text-primary" style={{ letterSpacing: "-0.3px" }}>
            {title}
          </h3>
          <p className="text-[13px] text-text-secondary mt-2">{body}</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-md text-[13px] font-bold text-white"
            style={{ background: confirmDanger ? "var(--color-danger)" : "var(--color-accent)" }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-md text-[13px] font-bold"
            style={{ border: "1.5px solid var(--color-border-strong)", color: "var(--color-text-secondary)" }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
