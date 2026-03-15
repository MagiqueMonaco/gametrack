export interface IgdbImageAsset {
  image_id: string;
}

export interface IgdbNamedEntity {
  name: string;
}

export interface IgdbPlatform extends IgdbNamedEntity {
  abbreviation?: string | null;
}

export interface IgdbCompany {
  id?: number | null;
  name?: string | null;
}

export interface IgdbInvolvedCompany {
  company?: IgdbCompany | null;
  developer?: boolean | null;
  publisher?: boolean | null;
}

export interface IgdbAgeRating {
  rating_category?: number;
}

export interface IgdbWebsite {
  category?: number | null;
  url?: string | null;
}

export interface IgdbGameRecord {
  id: number;
  name: string;
  category?: number | null;
  game_type?: number | null;
  version_parent?: number | null;
  cover?: IgdbImageAsset | null;
  artworks?: IgdbImageAsset[] | null;
  screenshots?: IgdbImageAsset[] | null;
  summary?: string | null;
  storyline?: string | null;
  url?: string | null;
  genres?: IgdbNamedEntity[] | null;
  platforms?: IgdbPlatform[] | null;
  involved_companies?: IgdbInvolvedCompany[] | null;
  first_release_date?: number | null;
  total_rating?: number | null;
  age_ratings?: IgdbAgeRating[] | null;
  websites?: IgdbWebsite[] | null;
}

export interface IgdbCompanyRecord {
  id: number;
  name: string;
  logo?: IgdbImageAsset | null;
}

const STANDALONE_GAME_CATEGORIES = [0, 8, 9];

export function isStandaloneGame(game: Pick<IgdbGameRecord, "category" | "game_type" | "version_parent">) {
  return STANDALONE_GAME_CATEGORIES.includes(game.category ?? game.game_type ?? 0) && !game.version_parent;
}
