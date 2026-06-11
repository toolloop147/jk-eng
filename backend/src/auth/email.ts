export function normalizeEmail(email: string): string {
  const trimmed = email.toLowerCase().trim();
  if (trimmed === "admin") return "admin@jk.local";
  if (!trimmed.includes("@")) return `${trimmed}@jk.local`;
  return trimmed;
}
