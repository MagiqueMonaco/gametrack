import Link from 'next/link';
import Image from 'next/image';
import { Game } from './GameCard';
import { Star } from 'lucide-react';

async function getTopGames(limit: number): Promise<Game[]> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/games?category=top&limit=${limit}`, {
            cache: 'no-store',
        });
        if (!res.ok) throw new Error("Failed to fetch games");
        return res.json();
    } catch (error) {
        console.error(`Error fetching top games:`, error);
        return [];
    }
}

export default async function TopRatedList() {
    const games = await getTopGames(9);

    if (!games || games.length === 0) return null;

    return (
        <section className="mb-12 md:mb-20">
            <div className="flex items-end justify-between mb-4 md:mb-6 text-foreground pb-2 border-b-2 border-border/40">
                <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white/90">Highest Rated Graphics & Gameplay</h2>
                <Link 
                    href="/search?category=top" 
                    className="text-xs md:text-sm font-bold tracking-widest uppercase text-primary hover:text-primary-hover hover:underline transition-colors pb-1"
                >
                    View All
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {games.map((game, index) => (
                    <Link
                        key={game.id}
                        href={`/game/${game.id}`}
                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors border border-transparent hover:border-border/50"
                    >
                        {/* Compact Thumbnail */}
                        <div className="relative w-16 h-20 md:w-20 md:h-24 shrink-0 rounded-lg overflow-hidden border border-border/30 shadow-md">
                            <Image
                                src={game.thumbnail}
                                alt={game.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="80px"
                                unoptimized={game.thumbnail.includes('nocover')}
                            />
                            {/* Rank Badge */}
                            <div className="absolute top-0 left-0 bg-black/80 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-br-lg text-[10px] font-bold z-10">
                                #{index + 1}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                            <h3 className="font-bold text-sm md:text-base text-white/90 group-hover:text-primary transition-colors line-clamp-1">
                                {game.title}
                            </h3>
                            <span className="text-xs text-foreground/60 font-medium mb-1 truncate">
                                {game.genre} • {game.developer}
                            </span>
                            
                            {game.rating && (
                                <div className="flex items-center gap-1 mt-auto">
                                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs font-bold text-yellow-500/90">{game.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
