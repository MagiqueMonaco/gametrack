import Link from 'next/link';
import GameCard from './GameCard';
import { Game } from './GameCard';

async function getGamesForCategory(category: string, limit: number): Promise<Game[]> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/games?category=${category}&limit=${limit}`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function GameGridSection({ title, category, limit = 10 }: { title: string, category: string, limit?: number }) {
    const games = await getGamesForCategory(category, limit);

    if (!games || games.length === 0) return null;

    return (
        <section className="mb-12 md:mb-20">
            <div className="flex items-end justify-between mb-4 md:mb-6 text-foreground pb-2 border-b-2 border-border/40">
                <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white/90">{title}</h2>
                <Link 
                    href={`/search?category=${category}`}
                    className="text-xs md:text-sm font-bold tracking-widest uppercase text-primary hover:text-primary-hover hover:underline transition-colors pb-1"
                >
                    View All
                </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {games.map((game) => (
                    <div key={game.id} className="w-full">
                        <GameCard game={game} />
                    </div>
                ))}
            </div>
        </section>
    );
}
