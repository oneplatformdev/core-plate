import { parseCanonicalDateValue } from '@platejs/date';

type DateLocale = 'en' | 'uk';

type DateLabelMessages = {
  today: string;
  yesterday: string;
  tomorrow: string;
};

const isSameCalendarDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function formatDateLabel(
  value: { date?: string; rawDate?: string },
  locale: DateLocale,
  messages: DateLabelMessages,
  now = new Date()
) {
  if (value.rawDate) return value.rawDate;
  if (!value.date) return undefined;

  const parsed = parseCanonicalDateValue(value.date);
  if (!parsed) return value.rawDate ?? value.date;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameCalendarDay(parsed, today)) return messages.today;
  if (isSameCalendarDay(parsed, yesterday)) return messages.yesterday;
  if (isSameCalendarDay(parsed, tomorrow)) return messages.tomorrow;

  return parsed.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
