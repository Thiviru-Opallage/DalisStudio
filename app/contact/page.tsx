"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type FieldErrors = {
  name?:    string[];
  email?:   string[];
  phone?:   string[];
  message?: string[];
};

export default function ContactPage() {
  const [form, setForm]           = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [globalError, setGlobalError]   = useState("");
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit() {
    setGlobalError("");
    setFieldErrors({});

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setGlobalError("Please fill in Name, Email, and Message.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (res.status === 429) {
        setGlobalError("Too many requests. Please wait a few minutes and try again.");
        return;
      }
      if (res.status === 400 && data.errors) {
        setFieldErrors(data.errors);
        return;
      }
      if (!res.ok) {
        setGlobalError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setGlobalError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section className="min-h-screen bg-white flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
          <p className="text-gray-500 mb-6">
            Thanks for reaching out. I'll get back to you soon.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="text-sm underline text-gray-500 hover:text-black transition"
          >
            Send another message
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-white text-black px-8 py-24">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold mb-12"
      >
        Let's Connect
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-xl space-y-4"
      >
        {globalError && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {globalError}
          </div>
        )}

        {/* Name */}
        <div>
          <input
            type="text"
            placeholder="Name *"
            value={form.name}
            onChange={set("name")}
            disabled={loading}
            className={`w-full border px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition disabled:opacity-50 ${
              fieldErrors.name ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            placeholder="Email *"
            value={form.email}
            onChange={set("email")}
            disabled={loading}
            className={`w-full border px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition disabled:opacity-50 ${
              fieldErrors.email ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Phone (optional) */}
        <div>
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={set("phone")}
            disabled={loading}
            className={`w-full border px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition disabled:opacity-50 ${
              fieldErrors.phone ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.phone && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.phone[0]}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <textarea
            placeholder="Message *"
            rows={5}
            value={form.message}
            onChange={set("message")}
            disabled={loading}
            className={`w-full border px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition disabled:opacity-50 resize-none ${
              fieldErrors.message ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.message && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.message[0]}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending…" : "Send Message"}
        </button>
      </motion.div>
    </section>
  );
}