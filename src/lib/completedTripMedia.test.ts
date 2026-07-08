import { describe, expect, it } from 'vitest';
import {
  getCoverMedia,
  getCoverObjectPosition,
  normalizeTripMedia,
  tripMediaToLegacyFields,
} from './completedTripMedia';

describe('normalizeTripMedia', () => {
  it('builds ordered media from legacy fields', () => {
    const items = normalizeTripMedia({
      cover_image: 'https://example.com/cover.jpg',
      gallery: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      video_url: 'https://example.com/video.mp4',
    });

    expect(items).toHaveLength(4);
    expect(items[0].url).toBe('https://example.com/cover.jpg');
    expect(items[0].is_cover).toBe(true);
    expect(items.at(-1)?.type).toBe('video');
  });
});

describe('tripMediaToLegacyFields', () => {
  it('syncs cover, gallery and video from media list', () => {
    const result = tripMediaToLegacyFields([
      { id: '1', type: 'image', url: 'https://example.com/cover.jpg', is_cover: true, focal_x: 20, focal_y: 80 },
      { id: '2', type: 'image', url: 'https://example.com/other.jpg', is_cover: false },
      { id: '3', type: 'video', url: 'https://example.com/video.mp4', is_cover: false },
    ]);

    expect(result.cover_image).toBe('https://example.com/cover.jpg');
    expect(result.gallery).toEqual(['https://example.com/other.jpg']);
    expect(result.video_url).toBe('https://example.com/video.mp4');
    expect(result.media).toHaveLength(3);
  });
});

describe('getCoverObjectPosition', () => {
  it('returns focal point for cover image', () => {
    const cover = getCoverMedia([
      { id: '1', type: 'image', url: 'x', is_cover: true, focal_x: 25, focal_y: 75 },
    ]);
    expect(getCoverObjectPosition(cover)).toBe('25% 75%');
  });
});
