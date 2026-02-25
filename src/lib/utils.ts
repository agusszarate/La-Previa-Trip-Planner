/**
 * Generate a random alphanumeric string of given length.
 * No external dependencies needed.
 */
export function nanoid(length: number = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

/**
 * Format currency amount for display
 */
export function formatMoney(amount: number, currency: string = "ARS"): string {
  return `${amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })} ${currency}`;
}

/**
 * Format date for display in Argentine locale
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Get initials from a name or email
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.split(/[\s@]+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}
