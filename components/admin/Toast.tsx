"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string | null;
  tone?: "success" | "error";
  onDismiss?: () => void;
};

export function Toast({ message, tone = "success", onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-6 bottom-6 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
        tone === "success"
          ? "border-gold/35 bg-forest-soft/95 text-gold"
          : "border-red-400/40 bg-forest-soft/95 text-red-200"
      }`}
    >
      {message}
    </div>
  );
}
