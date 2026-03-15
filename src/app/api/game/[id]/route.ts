import { NextResponse } from 'next/server';
import { getIgdbToken } from '@/lib/igdbAuth';
import { IgdbGameRecord, IgdbImageAsset, IgdbInvolvedCompany, IgdbNamedEntity, IgdbPlatform } from '@/lib/igdb';
import { getAgeRatingString } from '@/lib/ratings';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const gameId = resolvedParams.id;

  if (!gameId || !/^\d+$/.test(gameId)) {
    return NextResponse.json({ error: 'A valid numeric Game ID is required' }, { status: 400 });
  }

  try {
    const accessToken = await getIgdbToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error('IGDB_CLIENT_ID is missing from environment variables.');
    }

    const query = `
      fields name,cover.image_id,summary,storyline,url,genres.name,platforms.name,platforms.abbreviation,
      involved_companies.company.name,involved_companies.developer,involved_companies.publisher,
      first_release_date,screenshots.image_id,similar_games.name,similar_games.cover.image_id,websites.category,websites.url,
      total_rating,age_ratings.rating_category; 
      where id = ${gameId};
    `;

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain',
      },
      body: query,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`IGDB API Error: ${res.status} ${errorText}`);
      throw new Error(`IGDB API responded with status: ${res.status}`);
    }

    const rawGames = (await res.json()) as IgdbGameRecord[];
    
    if (!rawGames || rawGames.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const g = rawGames[0];
    
    // Format full details
    const coverUrl = g.cover?.image_id 
      ? `https://images.igdb.com/igdb/image/upload/t_1080p/${g.cover.image_id}.jpg`
      : 'https://images.igdb.com/igdb/image/upload/t_1080p/nocover.png';

    const screenshotUrls = g.screenshots ? g.screenshots.map((screenshot: IgdbImageAsset) => `https://images.igdb.com/igdb/image/upload/t_1080p/${screenshot.image_id}.jpg`) : [];

    const developers = g.involved_companies?.filter((company: IgdbInvolvedCompany) => company.developer) || [];
    const publishers = g.involved_companies?.filter((company: IgdbInvolvedCompany) => company.publisher) || [];

    const formattedGame = {
      id: g.id,
      title: g.name,
      thumbnail: coverUrl,
      // Fallbacks
      short_description: g.summary || 'No description available.',
      description: g.storyline || g.summary || 'No description available.',
      game_url: g.url || `https://www.igdb.com/games/${g.id}`,
      genre: g.genres ? g.genres.map((genre: IgdbNamedEntity) => genre.name).join(', ') : 'Various',
      platform: g.platforms ? g.platforms.map((platform: IgdbPlatform) => platform.abbreviation || platform.name).join(', ') : 'Unknown',
      // Provide array of exact platform strings for the icon mapper
      platform_list: g.platforms ? g.platforms.map((platform: IgdbPlatform) => platform.name) : [],
      publisher: publishers.length > 0 ? publishers.map((company: IgdbInvolvedCompany) => company.company?.name || 'Unknown Publisher').join(', ') : 'Unknown Publisher',
      publisher_id: publishers.length > 0 ? publishers[0].company?.id ?? undefined : undefined,
      developer: developers.length > 0 ? developers.map((company: IgdbInvolvedCompany) => company.company?.name || 'Unknown Developer').join(', ') : 'Unknown Developer',
      developer_id: developers.length > 0 ? developers[0].company?.id ?? undefined : undefined,
      release_date: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().split('T')[0] : 'TBD',
      screenshots: screenshotUrls,
      websites: g.websites || [],
      rating: g.total_rating ? parseFloat((g.total_rating / 10).toFixed(1)) : null,
      age_rating: getAgeRatingString(g.age_ratings),
    };

    return NextResponse.json(formattedGame);
  } catch (error) {
    console.error('Error fetching game details from IGDB:', error);
    return NextResponse.json({ error: 'Failed to fetch game details' }, { status: 500 });
  }
}
