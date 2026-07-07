"use client";

import { useState } from "react";

type Message = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function MessagesTable({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages]   = useState(initial);
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [loading, setLoading]     = useState<number | null>(null);

  async function markRead(id: number) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}/mark-read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
        );
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 transition-all ${
            !m.is_read ? "border-l-4 border-l-black" : ""
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm sm:text-base truncate" style={{ color: "#000000" }}>
                  {m.name}
                </p>
                {!m.is_read && (
                  <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full shrink-0">
                    New
                  </span>
                )}
              </div>
              <p className="text-sm truncate" style={{ color: "#6b7280" }}>{m.email}</p>
              {m.phone && (
                <p className="text-sm" style={{ color: "#9ca3af" }}>{m.phone}</p>
              )}
            </div>
            <p className="text-xs whitespace-nowrap" style={{ color: "#9ca3af" }}>
              {new Date(m.created_at).toLocaleString("en-US", {
                timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
              })}
            </p>
          </div>

          {/* Preview / expand */}
          <div className="mt-3">
            {expanded === m.id ? (
              <p
                className="text-sm whitespace-pre-wrap leading-relaxed break-words"
                style={{ color: "#374151" }}
              >
                {m.message}
              </p>
            ) : (
              <p
                className="text-sm line-clamp-2 sm:truncate break-words"
                style={{ color: "#6b7280" }}
              >
                {m.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              className="min-h-[40px] px-3 flex items-center text-xs sm:text-sm hover:underline active:bg-blue-50 rounded-lg"
              style={{ color: "#2563eb" }}
            >
              {expanded === m.id ? "Collapse" : "Read more"}
            </button>

            {!m.is_read && (
              <button
                onClick={() => markRead(m.id)}
                disabled={loading === m.id}
                className="min-h-[40px] px-3 flex items-center text-xs sm:text-sm hover:text-black active:bg-gray-100 disabled:opacity-50 rounded-lg"
                style={{ color: "#6b7280" }}
              >
                {loading === m.id ? "Marking…" : "Mark as read"}
              </button>
            )}

            <a
              href={`mailto:${m.email}`}
              className="min-h-[40px] px-3 flex items-center text-xs sm:text-sm hover:text-black active:bg-gray-100 rounded-lg"
              style={{ color: "#6b7280" }}
            >
              Reply via email ↗
            </a>
          </div>
        </div>
      ))}

      {messages.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 text-center">
          <p className="text-sm" style={{ color: "#9ca3af" }}>No messages yet.</p>
        </div>
      )}
    </div>
  );
}