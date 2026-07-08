export type TripMediaItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  is_cover?: boolean;
  focal_x?: number;
  focal_y?: number;
};

export type CompletedTripLike = {
  cover_image?: string | null;
  gallery?: string[] | null;
  video_url?: string | null;
  media?: TripMediaItem[] | null;
};

const DEFAULT_FOCAL = 50;
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';

export function createMediaId() {
  return crypto.randomUUID();
}

export function normalizeTripMedia(trip: CompletedTripLike): TripMediaItem[] {
  if (Array.isArray(trip.media) && trip.media.length > 0) {
    return trip.media
      .filter((item) => item?.url)
      .map((item) => ({
        id: item.id || createMediaId(),
        type: item.type === 'video' ? 'video' : 'image',
        url: item.url,
        is_cover: Boolean(item.is_cover),
        focal_x: clampFocal(item.focal_x),
        focal_y: clampFocal(item.focal_y),
      }));
  }

  const items: TripMediaItem[] = [];

  if (trip.cover_image?.trim()) {
    items.push({
      id: createMediaId(),
      type: 'image',
      url: trip.cover_image,
      is_cover: true,
      focal_x: DEFAULT_FOCAL,
      focal_y: DEFAULT_FOCAL,
    });
  }

  for (const url of trip.gallery || []) {
    if (!url?.trim() || url === trip.cover_image) continue;
    items.push({
      id: createMediaId(),
      type: 'image',
      url,
      is_cover: false,
      focal_x: DEFAULT_FOCAL,
      focal_y: DEFAULT_FOCAL,
    });
  }

  if (trip.video_url?.trim()) {
    items.push({
      id: createMediaId(),
      type: 'video',
      url: trip.video_url,
      is_cover: false,
    });
  }

  return items;
}

export function getCoverMedia(items: TripMediaItem[]): TripMediaItem | null {
  const cover = items.find((item) => item.type === 'image' && item.is_cover);
  if (cover) return cover;
  return items.find((item) => item.type === 'image') ?? null;
}

export function getCoverImageUrl(trip: CompletedTripLike): string {
  const cover = getCoverMedia(normalizeTripMedia(trip));
  return cover?.url || trip.cover_image || PLACEHOLDER_IMAGE;
}

export function getCoverObjectPosition(item: TripMediaItem | null | undefined): string {
  if (!item || item.type !== 'image') return 'center';
  const x = clampFocal(item.focal_x);
  const y = clampFocal(item.focal_y);
  return `${x}% ${y}%`;
}

export function ensureSingleCover(items: TripMediaItem[]): TripMediaItem[] {
  let hasCover = false;
  return items.map((item) => {
    if (item.type !== 'image') {
      return { ...item, is_cover: false };
    }
    if (item.is_cover && !hasCover) {
      hasCover = true;
      return item;
    }
    return { ...item, is_cover: false };
  });
}

export function tripMediaToLegacyFields(items: TripMediaItem[]) {
  const normalized = ensureSingleCover(items);
  const cover = getCoverMedia(normalized);
  const gallery = normalized
    .filter((item) => item.type === 'image' && item.url !== cover?.url)
    .map((item) => item.url);
  const video = normalized.find((item) => item.type === 'video');

  return {
    media: normalized,
    cover_image: cover?.url || null,
    gallery,
    video_url: video?.url || null,
  };
}

function clampFocal(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULT_FOCAL;
  return Math.min(100, Math.max(0, Math.round(value)));
}
