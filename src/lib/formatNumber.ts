/**
 * Formats a number into a human-readable string.
 * Example: 1200 -> "1.2k", 1500000 -> "1.5M"
 *
 * @param num - The number to format.
 * @returns The formatted string.
 */
export function formatNumber(num: number): string {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`; // Convert to millions (e.g., 1.5M)
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}k`; // Convert to thousands (e.g., 1.2k)
    } else {
      return num.toString(); // Return the number as is for small values
    }
  }