// Lightweight input sanitization utilities for user-provided text

// Enforce max input size (10KB per the security plan)
const MAX_LEN = 10 * 1024; // 10KB

// Strip all HTML tags and dangerous characters. React escapes by default,
// but we defensively remove tags to avoid polluted content in storage/exports.
export function sanitizeText(raw: string): string {
  if (typeof raw !== 'string') return '';
  // Trim to max length early to keep performance predictable
  let s = raw.slice(0, MAX_LEN);
  // Remove any HTML tags
  s = s.replace(/<[^>]*>/g, '');
  // Normalize line endings and collapse weird unicode control characters
  s = s.replace(/\r\n?|\n/g, '\n');
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return s.trim();
}

export function sanitizeMaybe(raw: any): string {
  return sanitizeText(typeof raw === 'string' ? raw : String(raw ?? ''));
}

export function sanitizeTextArray(arr: string[] | undefined | null): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((v) => sanitizeText(v)).filter((v) => v.length > 0);
}

