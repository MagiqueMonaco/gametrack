import { NextResponse } from 'next/server';
import { getIgdbToken } from '@/lib/igdbAuth';
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
    const accessToken = await getIgdbToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error('IGDB_CLIENT_ID is missing from environment variables.');
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'top';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

    let queryConditions = 'sort total_rating_count desc;';
    
    switch (category) {
      case 'new':
        queryConditions = `sort first_release_date desc; where first_release_date != null & cover != null;`;
        break;
      case 'rpg':
        queryConditions = `where genres = (12); sort total_rating_count desc;`;
        break;
      case 'shooter':
        queryConditions = `where genres = (5); sort total_rating_count desc;`;
        break;
      case 'adventure':
        queryConditions = `where genres = (31); sort total_rating_count desc;`;
        break;
      case 'indie':
        queryConditions = `where genres = (32); sort total_rating_count desc;`;
        break;
      case 'action':
        queryConditions = `where genres = (33); sort total_rating_count desc;`;
        break;
      case 'strategy':
        queryConditions = `where genres = (15); sort total_rating_count desc;`;
        break;
      case 'sports':
        queryConditions = `where genres = (14); sort total_rating_count desc;`;
        break;
      case 'racing':
        queryConditions = `where genres = (10); sort total_rating_count desc;`;
        break;
      case 'fighting':
        queryConditions = `where genres = (4); sort total_rating_count desc;`;
        break;
      case 'trending':
        const trendingTimestamp = Math.floor(Date.now() / 1000) - (2 * 30 * 24 * 60 * 60); // Last 2 months
        const now = Math.floor(Date.now() / 1000);
        // Use 'hypes' to find genuinely anticipated/trending very recent games that are already out
        queryConditions = `where first_release_date >= ${trendingTimestamp} & first_release_date <= ${now} & hypes > 0 & cover != null; sort hypes desc;`;
        break;
      case 'anticipated':
        const upcomingTimestamp = Math.floor(Date.now() / 1000);
        queryConditions = `where first_release_date > ${upcomingTimestamp} & hypes > 0 & cover != null; sort hypes desc;`;
        break;
      case 'top':
      default:
        queryConditions = `sort total_rating_count desc;`;
        break;
    }

    // Prepare IGDB query
    const query = `
      fields name,category,game_type,version_parent,cover.image_id,summary,url,genres.name,platforms.name,platforms.abbreviation,involved_companies.company.name,first_release_date,total_rating,age_ratings.rating_category; 
      ${queryConditions}
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

    const rawGames = await res.json();
    
    // Filter out non-standalone items like bundles, DLCs, and game editions
    const allowedCategoryTypes = [0, 8, 9];
    const filteredGames = (rawGames || []).filter((g: any) => 
      allowedCategoryTypes.includes(g.category ?? g.game_type ?? 0) && !g.version_parent
    );
    
    // Map IGDB response to our GameCard format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedGames = filteredGames.map((g: any) => {
      // Find developer (involved_companies have a boolean for developer or publisher, but just grab the first company name for now if available)
      const developerName = g.involved_companies?.[0]?.company?.name || 'Unknown Developer';
      const developerId = g.involved_companies?.[0]?.company?.id || null;
      
      const platformsList = g.platforms ? g.platforms.map((p: {name: string, abbreviation?: string}) => p.abbreviation || p.name).join(', ') : 'Unknown';
      const genresList = g.genres ? g.genres.map((gn: {name: string}) => gn.name).join(', ') : 'Various';

      const coverUrl = g.cover?.image_id 
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
        : 'https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.png'; // Fallback

      return {
        id: g.id,
        title: g.name,
        thumbnail: coverUrl,
        short_description: g.summary || 'No description available.',
        game_url: g.url || `https://www.igdb.com/games/${g.id}`,
        genre: genresList.split(',')[0], // Primary genre
        platform: platformsList,
        publisher: developerName, // Simplify for demo
        developer: developerName,
        developer_id: developerId,
        release_date: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().split('T')[0] : 'TBD',
        freetogame_profile_url: g.url || '', 
        rating: g.total_rating ? parseFloat((g.total_rating / 10).toFixed(1)) : null,
        age_rating: getAgeRatingString(g.age_ratings),
      };
    });

    return NextResponse.json(formattedGames);
  } catch (error) {
    console.error('Error fetching IGDB games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games data' },
      { status: 500 }
    );
  }
}
