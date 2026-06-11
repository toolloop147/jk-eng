function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 11 && /^\d+$/.test(digits);
}

export function normalizeEmail(email: string): string {
  const trimmed = email.toLowerCase().trim();
  if (trimmed === "admin") return "admin@jk.local";
  if (!trimmed.includes("@")) {
    if (looksLikePhone(trimmed)) {
      return `${trimmed.replace(/\D/g, "")}@jk.local`;
    }
    return `${trimmed}@jk.local`;
  }
  return trimmed;
}
