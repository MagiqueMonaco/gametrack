import Image from 'next/image';
import Link from 'next/link';
import { Game } from './GameCard';

async function getFeaturedGameForCategory(category: string): Promise<Game | null> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/games?category=${category}&limit=1`, {
            cache: 'no-store', // can be changed to revalidate if needed
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data[0] || null;
    } catch {
        return null;
    }
}

export default async function GenreHighlights() {
    const [action, rpg, shooter, strategy] = await Promise.all([
        getFeaturedGameForCategory('action'),
        getFeaturedGameForCategory('rpg'),
        getFeaturedGameForCategory('shooter'),
        getFeaturedGameForCategory('strategy'),
    ]);

    if (!action || !rpg || !shooter) return null;

    return (
        <section className="mb-12 md:mb-20">
            <div className="flex items-end justify-between mb-4 md:mb-6 text-foreground pb-2 border-b-2 border-border/40">
                <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white/90">Browse by Genre</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[800px] md:h-[500px]">
                {/* Action & Adventure - Large left block */}
                <Link 
                    href="/search?category=action" 
                    className="group relative md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden shadow-lg shadow-black/20"
                >
                    <Image 
                        src={action.artwork || action.thumbnail} 
                        alt="Action Games" 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-primary/90 transition-colors duration-500" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
                    <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md rounded text-white mb-2 inline-block">Featured Genre</span>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-md mb-1">Action & Adventure</h3>
                        <p className="text-white/80 font-medium">Explore massive worlds and epic stories.</p>
                    </div>
                </Link>

                {/* RPGs - Top right wide block */}
                <Link 
                    href="/search?category=rpg" 
                    className="group relative md:col-span-2 md:row-span-1 rounded-2xl overflow-hidden shadow-lg shadow-black/20"
                >
                    <Image 
                        src={rpg.artwork || rpg.thumbnail} 
                        alt="RPG Games" 
                        fill 
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-purple-900/90 transition-colors duration-500" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
                    <div className="absolute bottom-6 left-6 md:bottom-6 md:left-6">
                        <h3 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-md mb-1">Role-Playing</h3>
                        <p className="text-white/80 text-sm font-medium">Craft your own legacy.</p>
                    </div>
                </Link>

                {/* Shooters - Bottom right small block 1 */}
                <Link 
                    href="/search?category=shooter" 
                    className="group relative md:col-span-1 md:row-span-1 rounded-2xl overflow-hidden shadow-lg shadow-black/20"
                >
                    <Image 
                        src={shooter.artwork || shooter.thumbnail} 
                        alt="Shooter Games" 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-red-900/90 transition-colors duration-500" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
                    <div className="absolute bottom-5 left-5">
                        <h3 className="text-xl md:text-2xl font-extrabold text-white drop-shadow-md">Shooters</h3>
                    </div>
                </Link>

                {/* Strategy - Bottom right small block 2 */}
                {strategy && (
                    <Link 
                        href="/search?category=strategy" 
                        className="group relative md:col-span-1 md:row-span-1 rounded-2xl overflow-hidden shadow-lg shadow-black/20"
                    >
                        <Image 
                            src={strategy.artwork || strategy.thumbnail} 
                            alt="Strategy Games" 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-blue-900/90 transition-colors duration-500" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
                        <div className="absolute bottom-5 left-5">
                            <h3 className="text-xl md:text-2xl font-extrabold text-white drop-shadow-md">Strategy</h3>
                        </div>
                    </Link>
                )}
            </div>
        </section>
    );
}
