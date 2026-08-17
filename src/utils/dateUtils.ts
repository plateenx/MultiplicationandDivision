/**
 * Date & Time formatting utilities for Thailand / App Timezone (Asia/Bangkok, GMT+7)
 */

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Returns standard ISO 8601 UTC timestamp string for database storage.
 * e.g. "2026-08-17T22:15:30.123Z"
 * 
 * Standard practice in PostgreSQL / Supabase:
 * Saving standard ISO 8601 UTC ensures perfect cross-platform compatibility,
 * correct chronological sorting, and seamless conversion to Thailand Time (GMT+7)
 * upon display.
 */
export function getThailandIsoString(dateInput?: Date | string | number | null): string {
  if (!dateInput) {
    return new Date().toISOString();
  }
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date().toISOString() : dateInput.toISOString();
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  const d = parseDateSafely(dateInput);
  return d.toISOString();
}

export const getNowIsoString = getThailandIsoString;

/**
 * Safely parses any date input (ISO UTC string, Supabase SQL timestamptz, offset string, epoch ms, Date)
 * into a valid JavaScript Date object.
 */
export function parseDateSafely(dateInput: string | number | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  let str = String(dateInput).trim();
  if (!str) return new Date();

  // Handle Supabase / PostgreSQL string formats:
  // e.g. "2026-08-17 21:56:36.998+00" or "2026-08-17 21:56:36+07" -> replace space with 'T'
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  // Handle 2-digit timezone offset like "+00" or "+07" at the end -> make it "+00:00" or "+07:00"
  if (/[+-]\d{2}$/.test(str)) {
    str = str + ':00';
  }

  // Attempt 1: Standard new Date(str)
  const d1 = new Date(str);
  if (!isNaN(d1.getTime())) {
    return d1;
  }

  // Attempt 2: If no timezone indicator was present, append 'Z' for UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str)) {
    const d2 = new Date(str + 'Z');
    if (!isNaN(d2.getTime())) {
      return d2;
    }
  }

  // Fallback: parse numeric components
  const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (match) {
    const fallback = new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10),
      parseInt(match[4], 10),
      parseInt(match[5], 10),
      parseInt(match[6] || '0', 10)
    );
    if (!isNaN(fallback.getTime())) {
      return fallback;
    }
  }

  return new Date();
}

/**
 * Formats any date into Thailand local representation:
 * - Buddhist Era (พ.ศ. = ค.ศ. + 543)
 * - Thai Month name (e.g. 18 ส.ค. 2569 or 18 สิงหาคม 2569)
 * - 24-hour Thai local clock time (Asia/Bangkok, GMT+7)
 */
export function formatThaiDateTime(
  dateInput: string | number | Date | null | undefined,
  options?: {
    showSeconds?: boolean;
    dateStyle?: 'short' | 'medium' | 'full';
    includeTime?: boolean;
    includeDayOfWeek?: boolean;
  }
): string {
  if (!dateInput) return '-';

  try {
    const d = parseDateSafely(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    // Extract Asia/Bangkok (GMT+7) date parts using standard Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    const findPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

    const yearCE = parseInt(findPart('year'), 10);
    const thaiYear = yearCE + 543;
    const month = parseInt(findPart('month'), 10);
    const day = parseInt(findPart('day'), 10);
    const hh = findPart('hour').padStart(2, '0');
    const mm = findPart('minute').padStart(2, '0');
    const ss = findPart('second').padStart(2, '0');

    const monthName =
      options?.dateStyle === 'full'
        ? THAI_MONTHS_FULL[month - 1] || `${month}`
        : THAI_MONTHS_SHORT[month - 1] || `${month}`;

    const datePart = `${day} ${monthName} ${thaiYear}`;
    const showSeconds = options?.showSeconds ?? false;
    const includeTime = options?.includeTime ?? true;

    if (!includeTime) {
      return datePart;
    }

    const timePart = showSeconds ? `${hh}:${mm}:${ss} น.` : `${hh}:${mm} น.`;
    return `${datePart} ${timePart}`;
  } catch {
    return String(dateInput);
  }
}

export function getCurrentThaiTimeDisplay(): {
  iso: string;
  thaiFormatted: string;
  bangkokTime: string;
  timezoneLabel: string;
} {
  const now = new Date();
  const thaiIso = getThailandIsoString(now);
  return {
    iso: thaiIso,
    thaiFormatted: formatThaiDateTime(now, { showSeconds: true, dateStyle: 'full' }),
    bangkokTime: new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now),
    timezoneLabel: 'เวลาประเทศไทย (Asia/Bangkok, GMT+7)',
  };
}


