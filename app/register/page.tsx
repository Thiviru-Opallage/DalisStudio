"use client";

import { useState }  from "react";
import { motion }    from "framer-motion";
import { signIn }    from "next-auth/react";
import Link          from "next/link";

type FieldErrors = {
  name?:     string[];
  email?:    string[];
  password?: string[];
};

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState("");

  const handleRegister = async () => {
    setFieldErrors({});
    setGlobalError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setGlobalError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      // ── Step 1: Register ───────────────────────────────
      const res  = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (res.status === 429) {
        setGlobalError(data.error ?? "Too many attempts. Please wait a few minutes.");
        return;
      }

      if (res.status === 400) {
        if (data.errors && typeof data.errors === "object") {
          setFieldErrors(data.errors as FieldErrors);
        } else {
          setGlobalError(data.error ?? "Please check your details and try again.");
        }
        return;
      }

      if (!res.ok && !data.success) {
        setGlobalError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // ── Step 2: Auto sign-in ───────────────────────────
      const result = await signIn("credentials", {
        email:    form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setGlobalError("Account created! Please go to the login page and sign in.");
        return;
      }

      window.location.href = "/";
    } catch {
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 border border-gray-200 rounded-xl shadow-sm bg-white"
      >
        <h1 className="text-3xl font-semibold mb-2 text-black">Create Account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline cursor-pointer hover:text-black transition-colors text-black"
          >
            Sign in
          </Link>
        </p>

        {globalError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200
                          text-sm text-red-700">
            {globalError}
          </div>
        )}

        {/* Name */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={loading}
            className={`w-full border p-3 rounded focus:outline-none
                        focus:ring-2 focus:ring-black transition
                        disabled:opacity-50 text-black placeholder-gray-400 bg-white
                        ${fieldErrors.name ? "border-red-400" : "border-gray-300"}`}
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-3">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={loading}
            className={`w-full border p-3 rounded focus:outline-none
                        focus:ring-2 focus:ring-black transition
                        disabled:opacity-50 text-black placeholder-gray-400 bg-white
                        ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-5">
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            className={`w-full border p-3 rounded focus:outline-none
                        focus:ring-2 focus:ring-black transition
                        disabled:opacity-50 text-black placeholder-gray-400 bg-white
                        ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`}
          />
          {fieldErrors.password && (
            <ul className="mt-1 space-y-0.5">
              {fieldErrors.password.map((err, i) => (
                <li key={i} className="text-xs text-red-500">• {err}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Register button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded mb-4
                     cursor-pointer hover:bg-gray-900 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>

        <div className="text-center text-sm text-gray-400 mb-4">OR</div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2
                     border border-gray-300 py-3 rounded
                     cursor-pointer hover:bg-gray-50 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed text-black"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </motion.div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
    </svg>
  );
}