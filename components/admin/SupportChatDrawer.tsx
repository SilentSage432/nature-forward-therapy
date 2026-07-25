"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
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

const QUICK_PROMPTS = [
  { emoji: "🐞", label: "Report a small bug" },
  { emoji: "💡", label: "Suggest a feature idea" },
  { emoji: "❓", label: "Help with an essay / image" },
] as const;

const POLL_MS = 5000;

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

export function SupportChatDrawer() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userId = session?.user?.id;

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support");
      if (!res.ok) return;
      const data = (await res.json()) as { messages: SupportMessage[] };
      setMessages(data.messages ?? []);
    } catch {
      // Quiet poll failures; keep last known thread.
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void loadMessages().finally(() => setLoading(false));
    const id = window.setInterval(() => {
      void loadMessages();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [open, loadMessages]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
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
        setError(data.error ?? "Could not send message.");
        return;
      }
      if (data.message) {
        setMessages((prev) => [...prev, data.message!]);
      }
      setDraft("");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-forest-soft/95 px-4 py-3 font-heading text-sm font-semibold text-gold shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-gold hover:bg-forest-soft hover:text-amber-100"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        💬 Need Help / Chat with Dev
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-forest/60 backdrop-blur-[2px]"
            aria-label="Close support chat"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-desk-title"
            className="support-drawer-panel relative flex h-full w-full max-w-md flex-col border-l border-sage-dark/40 bg-forest-light shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-sage-dark/40 bg-forest-soft/90 px-5 py-4">
              <div>
                <h2
                  id="support-desk-title"
                  className="font-heading text-lg font-semibold text-gold"
                >
                  Flock of Fox Tech Desk
                </h2>
                <p className="mt-1 flex items-center gap-2 text-xs text-emerald-300">
                  <span
                    className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"
                    aria-hidden="true"
                  />
                  Developer Online
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-sage-dark/40 p-2 text-sage-light hover:border-gold/50 hover:text-gold"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex flex-wrap gap-2 border-b border-sage-dark/30 px-4 py-3">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() =>
                    setDraft(`${prompt.emoji} ${prompt.label}: `)
                  }
                  className="rounded-full border border-sage-dark/50 bg-forest/70 px-3 py-1.5 text-xs text-sage-light transition hover:border-gold/40 hover:text-gold"
                >
                  {prompt.emoji} {prompt.label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {loading && messages.length === 0 ? (
                <p className="text-center text-sm text-sage-dark">
                  Loading conversation…
                </p>
              ) : null}
              {!loading && messages.length === 0 ? (
                <p className="rounded-xl border border-dashed border-sage-dark/40 bg-forest/40 px-4 py-6 text-center text-sm text-sage-light">
                  Say hello — tap a quick prompt or type a note for the
                  developer desk.
                </p>
              ) : null}
              {messages.map((msg) => {
                const mine = userId ? msg.senderId === userId : msg.senderRole === "EDITOR";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                        mine
                          ? "rounded-br-md bg-sage/40 text-parchment ring-1 ring-amber-200/25"
                          : "rounded-bl-md bg-[#12201e] text-sage-light ring-1 ring-sage-dark/50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <p
                        className={`mt-1.5 text-[10px] ${
                          mine ? "text-amber-200/70" : "text-sage-dark"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                        {msg.status === "RESOLVED" ? " · Resolved" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={onSubmit}
              className="border-t border-sage-dark/40 bg-forest-soft/80 px-4 py-3"
            >
              {error ? (
                <p className="mb-2 text-xs text-red-300" role="alert">
                  {error}
                </p>
              ) : null}
              <label className="sr-only" htmlFor="support-chat-input">
                Message
              </label>
              <textarea
                id="support-chat-input"
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message…"
                className="mb-2 w-full resize-none rounded-xl border border-sage-dark/40 bg-forest/80 px-3 py-2 text-sm text-sage-light placeholder:text-sage-dark focus:border-gold/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || draft.trim().length === 0}
                className="btn-gold inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-heading text-sm font-semibold text-forest disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
