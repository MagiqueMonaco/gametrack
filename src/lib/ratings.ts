import type { IgdbAgeRating } from '@/lib/igdb';

export function getAgeRatingString(ageRatings?: IgdbAgeRating[] | null): string | null {
  if (!ageRatings || !Array.isArray(ageRatings)) return null;

  // Try to find ESRB first (categories 1-7 map to ESRB ratings)
  const esrb = ageRatings.find(r => r.rating_category && r.rating_category >= 1 && r.rating_category <= 7);
  if (esrb) {
    switch (esrb.rating_category) {
      case 1: return 'RP';
      case 2: return 'EC';
      case 3: return 'E';
      case 4: return 'E10+';
      case 5: return 'T';
      case 6: return 'M';
      case 7: return 'AO';
    }
  }

  // Fallback to PEGI (categories 8-12 map to PEGI ratings)
  const pegi = ageRatings.find(r => r.rating_category && r.rating_category >= 8 && r.rating_category <= 12);
  if (pegi) {
    switch (pegi.rating_category) {
      case 8: return 'PEGI 3';
      case 9: return 'PEGI 7';
      case 10: return 'PEGI 12';
      case 11: return 'PEGI 16';
      case 12: return 'PEGI 18';
    }
  }

  return null;
}

export const AGE_RATING_DESCRIPTIONS: Record<string, string> = {
  'RP': 'Rating Pending',
  'EC': 'Early Childhood',
  'E': 'Everyone',
  'E10+': 'Everyone 10+',
  'T': 'Teen',
  'M': 'Mature 17+',
  'AO': 'Adults Only 18+',
  'PEGI 3': 'Suitable for ages 3 and over',
  'PEGI 7': 'Suitable for ages 7 and over',
  'PEGI 12': 'Suitable for ages 12 and over',
  'PEGI 16': 'Suitable for ages 16 and over',
  'PEGI 18': 'Suitable for ages 18 and over',
};
