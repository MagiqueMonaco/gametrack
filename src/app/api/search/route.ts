import { NextResponse } from 'next/server';
import { getIgdbToken } from '@/lib/igdbAuth';
import { IgdbGameRecord, isStandaloneGame } from '@/lib/igdb';
import { getAgeRatingString } from '@/lib/ratings';

// Keep rate limiting logic
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.delete(ip);
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '48', 10) || 48, 1), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    if (!searchQuery) {
        return NextResponse.json([]);
    }

    const accessToken = await getIgdbToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error('IGDB_CLIENT_ID is missing from environment variables.');
    }

    // Prepare IGDB query
    const query = `
      search "${searchQuery.replace(/"/g, '')}";
      fields name,category,game_type,version_parent,cover.image_id,summary,url,genres.name,platforms.name,platforms.abbreviation,involved_companies.company.name,first_release_date,total_rating,age_ratings.rating_category; 
      limit ${limit}; 
      offset ${offset};
    `;

    // Fetch from IGDB
    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain', // IGDB parses raw text bodies
      },
      body: query,
      next: { revalidate: 3600 }, // Cache the resulting request
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`IGDB API Error: ${res.status} ${errorText}`);
      throw new Error(`IGDB API responded with status: ${res.status}`);
    }

    const rawGames = (await res.json()) as IgdbGameRecord[];
    const filteredGames = rawGames.filter(isStandaloneGame);

    const formattedGames = filteredGames.map((g) => {
      const developerName = g.involved_companies?.[0]?.company?.name || 'Unknown Developer';

      const platformsList = g.platforms ? g.platforms.map((p) => p.abbreviation || p.name).join(', ') : 'Unknown';
      const genresList = g.genres ? g.genres.map((genre) => genre.name).join(', ') : 'Various';

      const coverUrl = g.cover?.image_id 
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
        : 'https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.png'; // Fallback

      return {
        id: g.id,
        title: g.name,
        thumbnail: coverUrl,
        short_description: g.summary || 'No description available.',
        game_url: g.url || `https://www.igdb.com/games/${g.id}`,
        genre: genresList.split(',')[0] || 'Unknown', // Primary genre
        platform: platformsList,
        publisher: developerName, // Simplify for demo
        developer: developerName,
        release_date: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().split('T')[0] : 'TBD',
        freetogame_profile_url: g.url || '', 
        rating: g.total_rating ? parseFloat((g.total_rating / 10).toFixed(1)) : null,
        age_rating: getAgeRatingString(g.age_ratings),
      };
    });

    return NextResponse.json(formattedGames);
  } catch (error) {
    console.error('Error fetching search results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}
