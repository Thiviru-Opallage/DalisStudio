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
          className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
            !m.is_read ? "border-l-4 border-l-black" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{m.name}</p>
                {!m.is_read && (
                  <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">New</span>
                )}
              </div>
              <p className="text-sm text-gray-500">{m.email}</p>
              {m.phone && (
                <p className="text-sm text-gray-400">{m.phone}</p>
              )}
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(m.created_at).toLocaleString("en-US", {
                timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
              })}
            </p>
          </div>

          {/* Preview / expand */}
          <div className="mt-3">
            {expanded === m.id ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {m.message}
              </p>
            ) : (
              <p className="text-sm text-gray-500 truncate">{m.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-3 flex-wrap">
            <button
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              className="text-xs text-blue-600 hover:underline"
            >
              {expanded === m.id ? "Collapse" : "Read more"}
            </button>

            {!m.is_read && (
              <button
                onClick={() => markRead(m.id)}
                disabled={loading === m.id}
                className="text-xs text-gray-500 hover:text-black disabled:opacity-50"
              >
                {loading === m.id ? "Marking…" : "Mark as read"}
              </button>
            )}

            <a
              href={`mailto:${m.email}`}
              className="text-xs text-gray-500 hover:text-black"
            >
              Reply via email ↗
            </a>
          </div>
        </div>
      ))}

      {messages.length === 0 && (
        <div className="bg-white rounded-xl border p-10 text-center">
          <p className="text-gray-400 text-sm">No messages yet.</p>
        </div>
      )}
    </div>
  );
}