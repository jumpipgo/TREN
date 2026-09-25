import { describe, expect, it } from 'vitest';
import { parseYouTubeUrl } from '../utils/youtube';

describe('parseYouTubeUrl', () => {
  it('parses youtu.be links and preserves the start time', () => {
    const video = parseYouTubeUrl('https://youtu.be/oTzEfsTu6IE?t=144');

    expect(video?.id).toBe('oTzEfsTu6IE');
    expect(video?.start).toBe(144);
    expect(video?.embedUrl).toContain('autoplay=1');
    expect(video?.embedUrl).toContain('start=144');
  });

  it('parses watch, shorts, and embed links', () => {
    expect(parseYouTubeUrl('https://www.youtube.com/watch?v=d_yzauzvTBk')?.id).toBe('d_yzauzvTBk');
    expect(parseYouTubeUrl('https://youtube.com/shorts/oTzEfsTu6IE')?.id).toBe('oTzEfsTu6IE');
    expect(parseYouTubeUrl('https://www.youtube.com/embed/d_yzauzvTBk')?.id).toBe('d_yzauzvTBk');
  });

  it('rejects non-YouTube links', () => {
    expect(parseYouTubeUrl('https://example.com/watch?v=d_yzauzvTBk')).toBeNull();
  });
});
