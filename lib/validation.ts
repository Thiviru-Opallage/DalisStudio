import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const sanitizedString = (min: number, max: number, label: string) =>
  z
    .string()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .transform((val) =>
      sanitizeHtml(val.trim(), { allowedTags: [], allowedAttributes: {} })
    );

// ─────────────────────────────────────────
// SAFE URL VALIDATOR
// Rejects dangerous URI schemes (javascript:, data:, vbscript:, etc.)
// Allows only relative paths (/uploads/...) or https:// URLs.
// ─────────────────────────────────────────
const DANGEROUS_SCHEMES = /^\s*(javascript|data|vbscript|blob|file):/i;

// Allowed relative paths: /uploads/*, /videos/*, or single-segment public assets
const SAFE_RELATIVE =
  /^\/(?:uploads\/[\w.\-]+|videos\/[\w.\-]+|[\w.\-]+\.(?:jpg|jpeg|png|webp|gif|mp4|webm))$/i;

export const safeUrl = (maxLen = 500) =>
  z
    .string()
    .min(1, "URL is required")
    .max(maxLen, `URL must be at most ${maxLen} characters`)
    .refine(
      (val) => !DANGEROUS_SCHEMES.test(val),
      "Dangerous URL scheme detected"
    )
    .refine(
      (val) => !val.startsWith("//"),
      "Protocol-relative URLs are not allowed"
    )
    .refine(
      (val) => !val.includes(".."),
      "Path traversal detected"
    )
    .refine(
      (val) => val.startsWith("https://") || SAFE_RELATIVE.test(val),
      "URL must be /uploads/, /videos/, a public asset, or https://"
    );

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
export const registerSchema = z.object({
  name: sanitizedString(2, 100, "Name"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Must be at least 8 characters")
    .max(128, "Must be at most 128 characters")
    .regex(/[A-Z]/, "Must have at least one uppercase letter")
    .regex(/[a-z]/, "Must have at least one lowercase letter")
    .regex(/[0-9]/, "Must have at least one number")
    .regex(/[^A-Za-z0-9]/, "Must have at least one special character"),
});

// ─────────────────────────────────────────
// CONTACT
// ─────────────────────────────────────────
export const contactSchema = z.object({
  name: sanitizedString(2, 100, "Name"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
  phone: z
    .string()
    .max(30, "Phone number is too long")
    .regex(/^[\d\s\+\-\(\)]*$/, "Invalid phone number format")
    .optional()
    .nullable(),
  message: sanitizedString(10, 2000, "Message"),
});