/** Утиліти форматування для медіа-нод (audio / file). */

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** "5.2 MB", "812 KB". 0/undefined → null (нічого не показуємо). */
export function formatBytes(bytes?: number | null, decimals = 1): string | null {
  if (bytes == null || Number.isNaN(bytes) || bytes <= 0) return null;

  const i = Math.min(
    SIZE_UNITS.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / 1024 ** i;
  // Байти — без дробу.
  const fixed = i === 0 ? 0 : decimals;

  return `${value.toFixed(fixed)} ${SIZE_UNITS[i]}`;
}

/** Секунди → "m:ss" (наприклад 0:45, 4:20). */
export function formatTime(seconds?: number | null): string {
  if (seconds == null || Number.isNaN(seconds) || !Number.isFinite(seconds)) {
    return '0:00';
  }
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Тривалість у людському вигляді: "4 min 35 sec", "45 sec". */
export function formatDuration(seconds?: number | null): string | null {
  if (seconds == null || Number.isNaN(seconds) || !Number.isFinite(seconds)) {
    return null;
  }
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  if (mins === 0) return `${secs} sec`;
  return `${mins} min ${secs.toString().padStart(2, '0')} sec`;
}

/** Розширення файлу в нижньому регістрі ("lecture.PDF" → "pdf"). */
export function getFileExtension(name?: string | null): string {
  if (!name) return '';
  const clean = name.split(/[?#]/)[0];
  const idx = clean.lastIndexOf('.');
  if (idx < 0 || idx === clean.length - 1) return '';

  return clean.slice(idx + 1).toLowerCase();
}
