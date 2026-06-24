export interface Activity {
  name: string;
  description: string;
  category: string;
  estimated_cost: number;
  time_slot: string;
  is_suggestion?: boolean;
  image_url?: string;
  image_urls?: string[];
  image_position?: string;
  maps_url?: string;
}

export interface ItineraryDay {
  day: number;
  activities: Activity[];
}

export const MAX_ACTIVITY_IMAGES = 6;
export const MAX_ACCOMMODATION_IMAGES = 8;

export const categoryColors: Record<string, string> = {
  gastronomia: 'bg-orange-500/10 text-orange-700',
  cultura: 'bg-purple-500/10 text-purple-700',
  aventura: 'bg-red-500/10 text-red-700',
  natureza: 'bg-green-500/10 text-green-700',
  compras: 'bg-pink-500/10 text-pink-700',
  transporte: 'bg-blue-500/10 text-blue-700',
  hospedagem: 'bg-cyan-500/10 text-cyan-700',
};

export const timeSlotOrder = ['manhã', 'tarde', 'noite'];

/** Merge legacy single image with optional gallery array. */
export function getActivityImages(activity: Activity): string[] {
  const fromArray = (activity.image_urls ?? []).filter(Boolean);
  if (fromArray.length > 0) return fromArray;
  if (activity.image_url) return [activity.image_url];
  return [];
}

export function normalizeActivityImages(activity: Activity): Activity {
  const images = getActivityImages(activity);
  if (images.length === 0) {
    const { image_url, image_urls, image_position, ...rest } = activity;
    return rest;
  }
  return {
    ...activity,
    image_url: images[0],
    image_urls: images,
    image_position: activity.image_position || 'center center',
  };
}
