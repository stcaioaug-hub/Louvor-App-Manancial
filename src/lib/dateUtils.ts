/**
 * Utility functions for handling dates consistently across the app.
 * Avoids timezone issues when parsing "YYYY-MM-DD" strings.
 */

/**
 * Parses a "YYYY-MM-DD" string into a Date object at noon local time.
 * This avoids the day-shift issue when using new Date('YYYY-MM-DD').
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  // Months are 0-indexed in JS Date constructor
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formats a "YYYY-MM-DD" string into a Brazilian Portuguese locale string.
 */
export function formatFullDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
  });
}

/**
 * Extracts day and abbreviated weekday from a "YYYY-MM-DD" string.
 */
export function formatDashboardDate(dateStr: string) {
  const date = parseLocalDate(dateStr);
  return {
    day: date.getDate(),
    weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  };
}
