import Link from 'next/link';
import Image from 'next/image';
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

function CategoryColumn({ title, category, games }: { title: string, category: string, games: Game[] }) {
    if (!games || games.length === 0) return null;

    return (
        <div className="flex flex-col">
            <div className="flex items-end justify-between mb-4 border-b-2 border-border/40 pb-2">
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-white/90">{title}</h3>
                <Link 
                    href={`/search?category=${category}`} 
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-hover hover:underline transition-colors pb-0.5"
                >
                    All
                </Link>
            </div>
            <div className="flex flex-col gap-3">
                {games.map(game => (
                    <Link
                        key={game.id}
                        href={`/game/${game.id}`}
                        className="group flex flex-row items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors border border-transparent hover:border-border/50"
                    >
                        <div className="relative w-12 h-16 shrink-0 rounded overflow-hidden shadow">
                            <Image
                                src={game.thumbnail}
                                alt={game.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="48px"
                                unoptimized={game.thumbnail.includes('nocover')}
                            />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-white/90 group-hover:text-primary transition-colors line-clamp-1">{game.title}</h4>
                            <span className="text-xs text-foreground/60 font-medium truncate">{game.developer}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default async function CategoryColumns() {
    const [sports, racing, fighting] = await Promise.all([
        getGamesForCategory('sports', 5),
        getGamesForCategory('racing', 5),
        getGamesForCategory('fighting', 5),
    ]);

    if (!sports.length && !racing.length && !fighting.length) return null;

    return (
        <section className="mb-12 md:mb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
                <CategoryColumn title="Sports" category="sports" games={sports} />
                <CategoryColumn title="Racing" category="racing" games={racing} />
                <CategoryColumn title="Fighting" category="fighting" games={fighting} />
            </div>
        </section>
    );
}
