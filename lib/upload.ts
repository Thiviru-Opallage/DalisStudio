import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Whitelist of allowed mime types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4"];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// ─────────────────────────────────────────
// MAGIC BYTE VALIDATION
// Verify file content matches the claimed MIME type by checking
// the first bytes (file signature / magic number). This prevents
// attackers from spoofing the Content-Type header to bypass the
// whitelist (e.g., uploading a .html file disguised as image/jpeg).
// ─────────────────────────────────────────
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/png":  [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
  "image/webp": [
    // RIFF....WEBP — bytes 0-3 = "RIFF", bytes 8-11 = "WEBP"
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  "video/mp4": [
    // ftyp container — bytes 4-7 = "ftyp"
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  ],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  for (const sig of signatures) {
    if (buffer.length < sig.offset + sig.bytes.length) return false;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[sig.offset + i] !== sig.bytes[i]) return false;
    }
  }
  return true;
}

export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate MIME type against whitelist
  const mimeType = file.type.toLowerCase();
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

  if (!isImage && !isVideo) {
    throw new Error("Invalid file type. Only JPEG, PNG, WEBP, and MP4 are allowed.");
  }

  // Validate size
  if (isImage && buffer.length > MAX_IMAGE_SIZE) {
    throw new Error("Image size exceeds 10MB limit.");
  }
  if (isVideo && buffer.length > MAX_VIDEO_SIZE) {
    throw new Error("Video size exceeds 50MB limit.");
  }

  // Validate magic bytes — confirm actual file content matches claimed MIME type
  if (!validateMagicBytes(buffer, mimeType)) {
    throw new Error(
      "File content does not match the declared type. The file may be corrupted or spoofed."
    );
  }

  // Sanitize filename: remove directory traversal characters and special chars
  // Strip anything that isn't alphanumeric, dot, dash, or underscore
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/\.\.+/g, "."); // Prevent multiple dots

  // Generate unique filename
  const uniquePrefix = crypto.randomUUID();
  const fileName = `${uniquePrefix}-${sanitizedName}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  // Path traversal protection: verify resolved path is still inside UPLOAD_DIR
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
    throw new Error("Invalid file path detected.");
  }

  // Ensure uploads directory exists
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  // Write to disk
  await fs.writeFile(filePath, buffer);

  // Return public URL path
  return `/uploads/${fileName}`;
}
