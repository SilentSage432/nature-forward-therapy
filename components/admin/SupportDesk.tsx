"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { useSession } from "next-auth/react";

type SupportMessage = {
  id: string;
  senderId: string;
  senderEmail: string;
  senderRole: string;
  message: string;
  status: string;
  createdAt: string;
};

const POLL_MS = 4000;
export const SUPPORT_DESK_UPDATED_EVENT = "support-desk:updated";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function notifySupportDeskUpdated(openCount: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SUPPORT_DESK_UPDATED_EVENT, {
      detail: { openCount },
    }),
  );
}

export function SupportDesk() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedBanner, setResolvedBanner] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userId = session?.user?.id;

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support");
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: SupportMessage[];
        openCount: number;
      };
      const nextMessages = data.messages ?? [];
      const nextCount = data.openCount ?? nextMessages.length;
      setMessages(nextMessages);
      setOpenCount(nextCount);
      if (nextCount > 0) {
        setResolvedBanner(false);
      }
      notifySupportDeskUpdated(nextCount);
    } catch {
      // Keep last known thread on poll failure.
    }
  }, []);

  useEffect(() => {
    void loadMessages();
    const id = window.setInterval(() => {
      void loadMessages();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    setResolvedBanner(false);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as {
        message?: SupportMessage;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not send reply.");
        return;
      }
      if (data.message) {
        setMessages((prev) => [...prev, data.message!]);
        setOpenCount((prev) => prev + 1);
      }
      setDraft("");
      void loadMessages();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  async function markResolved() {
    if (resolving) return;
    setResolving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      const data = (await res.json()) as {
        updatedCount?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not update status.");
        return;
      }
      setMessages([]);
      setOpenCount(0);
      setResolvedBanner(true);
      notifySupportDeskUpdated(0);
      void loadMessages();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setResolving(false);
    }
  }

  const showEmptyResolved = messages.length === 0 && (resolvedBanner || openCount === 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-sage-light">
          <MessageCircle className="h-4 w-4 text-gold" aria-hidden="true" />
          {openCount > 0 ? (
            <span>
              <span className="font-semibold text-amber-200">{openCount}</span>{" "}
              open item{openCount === 1 ? "" : "s"} in the thread
            </span>
          ) : (
            <span>All caught up — no open support items.</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void markResolved()}
          disabled={resolving || openCount === 0}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-300/50 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {resolving ? "Resolving…" : "Mark Topic Resolved"}
        </button>
      </div>

      {showEmptyResolved && resolvedBanner ? (
        <div
          className="rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          All support topics resolved! No active messages.
        </div>
      ) : null}

      <div className="flex max-h-[min(60vh,520px)] flex-col rounded-2xl border border-sage-dark/30 bg-forest/50">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-sage-dark">
              {resolvedBanner
                ? "All support topics resolved! No active messages."
                : "No active messages. When Nicole writes from the practice portal, her notes will appear here."}
            </p>
          ) : (
            messages.map((msg) => {
              const mine = userId
                ? msg.senderId === userId
                : msg.senderRole === "DEVELOPER";
              return (
                <div
                  key={msg.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                      mine
                        ? "rounded-br-md bg-forest-soft text-sage-light ring-1 ring-sage-dark/60"
                        : "rounded-bl-md bg-sage/30 text-parchment"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-medium tracking-wide text-gold/80 uppercase">
                      {msg.senderRole === "EDITOR" ? "Nicole / Editor" : "You"}
                      {" · "}
                      {msg.senderEmail}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p className="mt-1.5 text-[10px] text-sage-dark">
                      {formatTime(msg.createdAt)}
                      {" · "}
                      {msg.status}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={sendReply}
          className="border-t border-sage-dark/40 bg-forest-soft/60 px-4 py-3"
        >
          {error ? (
            <p className="mb-2 text-xs text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <label className="sr-only" htmlFor="support-desk-reply">
            Quick reply
          </label>
          <textarea
            id="support-desk-reply"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Reply to Nicole…"
            className="mb-2 w-full resize-none rounded-xl border border-sage-dark/40 bg-forest/80 px-3 py-2 text-sm text-sage-light placeholder:text-sage-dark focus:border-gold/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            className="btn-gold inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-heading text-sm font-semibold text-forest disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {sending ? "Sending…" : "Send Reply"}
          </button>
        </form>
      </div>
    </div>
  );
}
