/**
 * Date & Time formatting utilities for Thailand / App Timezone
 */

export function formatThaiDateTime(
  dateInput: string | number | Date | null | undefined,
  options?: {
    showSeconds?: boolean;
    dateStyle?: 'short' | 'medium' | 'full';
    includeTime?: boolean;
  }
): string {
  if (!dateInput) return '-';

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const showSeconds = options?.showSeconds ?? false;
    const includeTime = options?.includeTime ?? true;

    // Use Intl.DateTimeFormat with Asia/Bangkok / th-TH locale
    const formatter = new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: options?.dateStyle === 'full' ? 'long' : 'short',
      day: 'numeric',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            second: showSeconds ? '2-digit' : undefined,
            hour12: false,
          }
        : {}),
    });

    return formatter.format(d);
  } catch {
    return String(dateInput);
  }
}

export function getCurrentThaiTimeDisplay(): {
  iso: string;
  thaiFormatted: string;
  bangkokTime: string;
} {
  const now = new Date();
  return {
    iso: now.toISOString(),
    thaiFormatted: formatThaiDateTime(now, { showSeconds: true, dateStyle: 'full' }),
    bangkokTime: new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now),
  };
}
