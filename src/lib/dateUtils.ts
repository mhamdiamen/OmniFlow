import { formatDistanceToNow, parseISO } from "date-fns";

/**
 * Formats a date string into a human-readable "time ago" string.
 * @param dateString - The date string (e.g., "2023-10-01T12:34:56Z").
 * @returns A formatted "time ago" string (e.g., "2 hours ago").
 */
export function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) {
    return "Just now"; // Fallback for missing or undefined date
  }

  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Invalid date string:", dateString);
    return "Just now"; // Fallback for invalid date strings
  }
}

/**
 * Formats a date string into a human-readable format (e.g., "October 22nd, 2024").
 * @param dateString - The date string to format (e.g., "2023-10-22T12:00:00Z").
 * @returns The formatted date string.
 */
export function formatDate(dateString: string | number): string {
  const date = new Date(typeof dateString === "string" ? parseFloat(dateString) : dateString);

  // Get the month name
  const month = date.toLocaleString("default", { month: "long" });

  // Get the day with the correct suffix (e.g., 1st, 2nd, 3rd, 4th)
  const day = date.getDate();
  let daySuffix;
  if (day === 1 || day === 21 || day === 31) {
    daySuffix = "st";
  } else if (day === 2 || day === 22) {
    daySuffix = "nd";
  } else if (day === 3 || day === 23) {
    daySuffix = "rd";
  } else {
    daySuffix = "th";
  }

  // Get the year
  const year = date.getFullYear();

  // Combine into the desired format
  return `${month} ${day}${daySuffix}, ${year}`;
}