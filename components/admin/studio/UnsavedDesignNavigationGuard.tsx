"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLeavingDesignEditor } from "@/lib/site-design/unsaved-navigation";

type PendingNavigation = {
  href: string;
  restoreFocus: HTMLElement | null;
};

type UnsavedDesignNavigationGuardProps = {
  dirty: boolean;
  children: ReactNode;
};

/**
 * Bounded in-app navigation guard for the Design editor.
 * Intercepts same-document link activations (capture phase) while dirty.
 * Keeps beforeunload responsibility with the parent editor.
 */
export function UnsavedDesignNavigationGuard({
  dirty,
  children,
}: UnsavedDesignNavigationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const descriptionId = useId();
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState<PendingNavigation | null>(null);

  const closeDialog = useCallback((restore = true) => {
    setPending((current) => {
      if (restore && current?.restoreFocus) {
        queueMicrotask(() => current.restoreFocus?.focus());
      }
      return null;
    });
  }, []);

  const confirmDiscard = useCallback(() => {
    if (!pending) return;
    const href = pending.href;
    setPending(null);
    router.push(href);
  }, [pending, router]);

  // Only show a dialog while dirty; clearing happens on Stay/Discard actions.
  const activePending = dirty ? pending : null;

  useEffect(() => {
    if (!dirty) return;

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      if (!isLeavingDesignEditor(href, pathname, window.location.origin)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const restoreFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      setPending({ href, restoreFocus });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, pathname]);

  useEffect(() => {
    if (!activePending) return;
    stayButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(true);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activePending, closeDialog]);

  return (
    <>
      {children}
      {activePending ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-md rounded-2xl border border-sage-dark/40 bg-forest p-5 shadow-xl"
          >
            <h2
              id={titleId}
              className="font-heading text-xl font-semibold text-white"
            >
              Discard unsaved design changes?
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-sage-light">
              You have design choices that are not saved yet. Leave this page
              only if you want to throw those choices away.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={stayButtonRef}
                type="button"
                onClick={() => closeDialog(true)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Stay and continue editing
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-sage-dark/40 px-4 py-2 text-sm font-semibold text-sage-light transition hover:border-red-300/40 hover:text-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Discard changes and leave
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
