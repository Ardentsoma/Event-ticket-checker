export function formatPrice(minor?: number | null, currency?: string | null): string {
  if (minor === null || minor === undefined) return '—';
  if (minor === 0) return 'Free';
  const amount = minor / 100;
  const curr = currency || 'NGN';
  try {
    return `${curr} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  } catch {
    return `${curr} ${amount}`;
  }
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export function formatDateTimeRange(startIso?: string | null, endIso?: string | null): string {
  if (!startIso) return '—';
  const datePart = formatDate(startIso);
  const startTime = formatTime(startIso);
  const endTime = endIso ? formatTime(endIso) : '';

  if (startTime && endTime) {
    return `${datePart} · ${startTime} – ${endTime}`;
  }
  if (startTime) {
    return `${datePart} · ${startTime}`;
  }
  return datePart;
}

export const formatEventDateTime = formatDateTimeRange;

export function getCategoryBadgeStyle(category?: string | null): { bg: string; text: string; border: string } {
  switch (category?.toLowerCase()) {
    case 'concert':
      return { bg: 'rgba(224, 167, 46, 0.15)', text: '#e0a72e', border: 'rgba(224, 167, 46, 0.3)' };
    case 'comedy':
      return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
    case 'meetup':
      return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
    case 'market':
      return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' };
    default:
      return { bg: 'rgba(155, 149, 131, 0.15)', text: '#d4cfbf', border: 'rgba(155, 149, 131, 0.3)' };
  }
}

export function getStatusBadgeStyle(status?: string | null): { bg: string; text: string; label: string } {
  switch (status?.toLowerCase()) {
    case 'upcoming':
      return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', label: 'Upcoming' };
    case 'completed':
      return { bg: 'rgba(155, 149, 131, 0.15)', text: '#9b9583', label: 'Completed' };
    case 'cancelled':
      return { bg: 'rgba(224, 98, 58, 0.15)', text: '#e0623a', label: 'Cancelled' };
    default:
      return { bg: 'rgba(155, 149, 131, 0.1)', text: '#9b9583', label: status || 'Scheduled' };
  }
}
