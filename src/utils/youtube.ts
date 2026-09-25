const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
]);

export interface YouTubeVideo {
  id: string;
  start: number;
  embedUrl: string;
}

function parseStart(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

/** Converts common YouTube links to one minimal, autoplaying embed URL. */
export function parseYouTubeUrl(input: string): YouTubeVideo | null {
  let url: URL;
  try {
    url = new URL(input, 'https://www.youtube.com');
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!YOUTUBE_HOSTS.has(host)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  let id = url.searchParams.get('v') ?? '';
  if (!id && host === 'youtu.be') id = segments[0] ?? '';
  if (!id && ['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')) id = segments[1] ?? '';
  if (!VIDEO_ID.test(id)) return null;

  const start = parseStart(url.searchParams.get('t') ?? url.searchParams.get('start') ?? url.searchParams.get('time_continue'));
  const params = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0' });
  if (start > 0) params.set('start', String(start));

  return {
    id,
    start,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
  };
}
