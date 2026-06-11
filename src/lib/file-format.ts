const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatBytes(bytes?: number | null, decimals = 1): string | null {
  if (bytes == null || Number.isNaN(bytes) || bytes <= 0) return null;

  const i = Math.min(
    SIZE_UNITS.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / 1024 ** i;
  const fixed = i === 0 ? 0 : decimals;

  return `${value.toFixed(fixed)} ${SIZE_UNITS[i]}`;
}

export function formatTime(seconds?: number | null): string {
  if (seconds == null || Number.isNaN(seconds) || !Number.isFinite(seconds)) {
    return '0:00';
  }
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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

export function getFileExtension(name?: string | null): string {
  if (!name) return '';
  const clean = name.split(/[?#]/)[0];
  const idx = clean.lastIndexOf('.');
  if (idx < 0 || idx === clean.length - 1) return '';

  return clean.slice(idx + 1).toLowerCase();
}
