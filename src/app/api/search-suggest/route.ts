import { NextResponse } from 'next/server';
import { getIgdbToken } from '@/lib/igdbAuth';
import { IgdbCompanyRecord, IgdbGameRecord, isStandaloneGame } from '@/lib/igdb';

// Rate limiting logic
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
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q');
    
    // We only need a few results for the autocomplete dropdown
    const gameLimit = Math.min(Math.max(parseInt(searchParams.get('gameLimit') || '3', 10) || 3, 1), 10);
    const companyLimit = Math.min(Math.max(parseInt(searchParams.get('companyLimit') || '2', 10) || 2, 1), 10);

    if (!searchQuery) {
        return NextResponse.json({ games: [], companies: [] });
    }

    const accessToken = await getIgdbToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    if (!clientId) {
      throw new Error('IGDB_CLIENT_ID is missing.');
    }

    const sanitizedQuery = searchQuery.replace(/"/g, '');

    // 1. Prepare Games Query
    const gamesQueryBody = `
      search "${sanitizedQuery}";
      fields name,category,game_type,version_parent,cover.image_id,involved_companies.company.name,first_release_date,total_rating; 
      limit ${gameLimit}; 
    `;

    // 2. Prepare Companies Query
    // IGDB companies endpoint requires `where name ~ *"query"*` instead of the `search` directive
    const companiesQueryBody = `
      fields name,logo.image_id; 
      where name ~ *"${sanitizedQuery}"*;
      limit ${companyLimit}; 
    `;

    const fetchOptions = {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'text/plain',
        },
        next: { revalidate: 3600 },
    };

    // Run both fetch requests in parallel
    const [gamesRes, companiesRes] = await Promise.all([
        fetch('https://api.igdb.com/v4/games', { ...fetchOptions, body: gamesQueryBody }),
        fetch('https://api.igdb.com/v4/companies', { ...fetchOptions, body: companiesQueryBody })
    ]);

    if (!gamesRes.ok) {
        console.error("IGDB Games Error:", await gamesRes.text());
        throw new Error(`IGDB Games API error: ${gamesRes.status}`);
    }

    if (!companiesRes.ok) {
        console.error("IGDB Companies Error:", await companiesRes.text());
        throw new Error(`IGDB Companies API error: ${companiesRes.status}`);
    }

    const rawGames = (await gamesRes.json()) as IgdbGameRecord[];
    const rawCompanies = (await companiesRes.json()) as IgdbCompanyRecord[];

    const filteredGames = rawGames.filter(isStandaloneGame);

    const formattedGames = filteredGames.map((g) => ({
        id: g.id,
        title: g.name,
        thumbnail: g.cover?.image_id 
            ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
            : 'https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.png',
        developer: g.involved_companies?.[0]?.company?.name || 'Unknown Developer',
        release_date: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().split('T')[0] : 'TBD',
        rating: g.total_rating ? parseFloat((g.total_rating / 10).toFixed(1)) : null,
    }));

    const formattedCompanies = rawCompanies.map((company) => ({
        id: company.id,
        name: company.name,
        logoUrl: company.logo?.image_id 
            ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${company.logo.image_id}.png`
            : null,
    }));

    return NextResponse.json({
        games: formattedGames,
        companies: formattedCompanies,
    });

  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search suggestions' },
      { status: 500 }
    );
  }
}
