"use client";

import { signIn }  from "next-auth/react";
import { motion }  from "framer-motion";
import { useState } from "react";
import Link         from "next/link";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email:    email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("Too many")) {
          setError("Too many login attempts. Please try again in 10 minutes.");
        } else if (result.error.includes("deactivated")) {
          setError("Your account has been deactivated. Please contact support.");
        } else if (result.error.includes("verified")) {
          setError("Please verify your email before logging in.");
        } else {
          setError("Invalid email or password.");
        }
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
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
        className="w-full max-w-md p-8 border border-gray-200 rounded-xl shadow-sm"
      >
        <h1 className="text-3xl font-semibold mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="underline cursor-pointer hover:text-black transition-colors"
          >
            Create one
          </Link>
        </p>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300
                     py-3 rounded cursor-pointer hover:bg-gray-50 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="text-center text-sm text-gray-400 mb-4">OR</div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200
                          text-sm text-red-700">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          disabled={loading}
          className="w-full mb-3 border border-gray-300 p-3 rounded
                     focus:outline-none focus:ring-2 focus:ring-black
                     transition disabled:opacity-50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          disabled={loading}
          className="w-full mb-5 border border-gray-300 p-3 rounded
                     focus:outline-none focus:ring-2 focus:ring-black
                     transition disabled:opacity-50"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded cursor-pointer
                     hover:bg-gray-900 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign In"}
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