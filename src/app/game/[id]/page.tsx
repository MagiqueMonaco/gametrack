import Header from '@/components/Header';
import Image from 'next/image';
import TrackGameButton from '@/components/TrackGameButton';
import { Calendar, Building2, Terminal, Globe2 } from 'lucide-react';
import { getUniquePlatformGroups } from '@/lib/platformIcons';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AGE_RATING_DESCRIPTIONS } from '@/lib/ratings';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

async function getGameDetails(id: string) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    try {
        const res = await fetch(`${baseUrl}/api/game/${id}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error("Failed to fetch game details");
        }

        return res.json();
    } catch (error) {
        console.error(`Error fetching game id ${id}:`, error);
        return null; // Return null to trigger notFound()
    }
}


export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const game = await getGameDetails(resolvedParams.id);

    if (!game) {
        return {
            title: 'Game Not Found - GameTrack',
            description: 'This game could not be found in our database.',
        };
    }

    // Default to the first screenshot if thumbnail is missing
    const ogImage = !game.thumbnail.includes('nocover') ? game.thumbnail : (game.screenshots?.[0] || '');

    // Strip IGDB's text formatting or extra newlines for a cleaner preview description
    const cleanDescription = game.description ? game.description.split('\n')[0].substring(0, 160) + (game.description.length > 160 ? '...' : '') : 'A game tracked on GameTrack.';

    return {
        title: `${game.title} - GameTrack`,
        description: cleanDescription,
        openGraph: {
            title: `${game.title} - GameTrack`,
            description: cleanDescription,
            url: `https://gametrack.app/game/${game.id}`,
            siteName: 'GameTrack',
            images: ogImage ? [{ url: ogImage, width: 800, height: 600, alt: game.title }] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${game.title} - GameTrack`,
            description: cleanDescription,
            images: ogImage ? [ogImage] : [],
        },
    };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const game = await getGameDetails(resolvedParams.id);

    if (!game) {
        notFound();
    }

    return (
        <>
            <Header />
            <main className="flex-1 flex flex-col pb-20 max-w-[2000px] mx-auto w-full">

                {/* Hero Section */}
                <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
                    {game.screenshots && game.screenshots.length > 0 ? (
                        <Image
                            src={game.screenshots[0]}
                            alt={`${game.title} background`}
                            fill
                            className="object-cover opacity-40 blur-sm mix-blend-screen"
                            priority
                            quality={100}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-primary/20 blur-3xl mix-blend-screen" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

                    <div className="absolute inset-0 container max-w-7xl mx-auto px-4 flex items-end pb-10">
                        <div className="flex flex-col md:flex-row gap-8 items-end w-full">
                            {/* Cover Art */}
                            <div className="relative w-[200px] h-[280px] shrink-0 rounded-2xl overflow-hidden border-2 border-border shadow-2xl z-10 hidden md:block group">
                                <Image
                                    src={game.thumbnail}
                                    alt={game.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    priority
                                    unoptimized={game.thumbnail.includes('nocover')}
                                />
                            </div>

                            {/* Title & Rapid Details */}
                            <div className="flex-1 z-10 w-full mb-4">
                                <div className="flex flex-wrap items-center gap-2 mb-4 lg:mb-6">
                                    {game.rating && (
                                        <span className="px-3 py-1 text-sm font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full shadow-sm flex items-center gap-1.5">
                                            ⭐ {game.rating.toFixed(1)} / 10
                                        </span>
                                    )}
                                    <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border border-primary/20 rounded-full">
                                        {game.genre}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold font-sans tracking-tight mb-4 drop-shadow-xl">{game.title}</h1>

                                <div className="flex flex-wrap items-center gap-6 text-foreground/80 font-mono text-sm max-w-2xl bg-surface/50 p-4 rounded-xl border border-border backdrop-blur-md">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span>{game.release_date !== 'TBD' ? new Date(game.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</span>
                                    </div>
                                    {game.age_rating && (
                                        <div className="flex items-center gap-2">
                                            <span
                                                title={AGE_RATING_DESCRIPTIONS[game.age_rating] || game.age_rating}
                                                className="px-1.5 py-0.5 text-[10px] font-bold border border-foreground/30 rounded text-foreground/70 tracking-wider cursor-help"
                                            >
                                                {game.age_rating}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 max-w-[200px]">
                                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                                        {game.developer_id ? (
                                            <Link href={`/company/${game.developer_id}`} className="truncate hover:text-primary transition-colors hover:underline">
                                                {game.developer}
                                            </Link>
                                        ) : (
                                            <span className="truncate" title={game.developer}>{game.developer}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="container max-w-7xl mx-auto px-4 pt-8">
                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* Left Column: Details & Media */}
                        <div className="flex-1 max-w-4xl space-y-12">

                            {/* Mobile Cover Art */}
                            <div className="relative w-[180px] h-[250px] mx-auto rounded-2xl overflow-hidden border-2 border-border shadow-2xl md:hidden mb-8">
                                <Image
                                    src={game.thumbnail}
                                    alt={game.title}
                                    fill
                                    className="object-cover"
                                    unoptimized={game.thumbnail.includes('nocover')}
                                />
                            </div>

                            {/* Synopsis */}
                            <section className="bg-surface border border-border rounded-2xl p-6 md:p-8">
                                <h2 className="text-2xl font-bold border-l-4 border-primary pl-4 mb-6">About the Game</h2>
                                <div className="prose prose-invert prose-p:text-foreground/80 prose-p:leading-relaxed max-w-none font-sans text-lg whitespace-pre-line">
                                    {game.description}
                                </div>
                            </section>

                            {/* Screenshots Gallery */}
                            {game.screenshots && game.screenshots.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold border-l-4 border-primary pl-4 mb-6">Media Gallery</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {game.screenshots.map((url: string, index: number) => (
                                            <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors">
                                                <Image
                                                    src={url}
                                                    alt={`${game.title} screenshot ${index + 1}`}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Column: Tracking & Specs */}
                        <div className="w-full lg:w-[380px] shrink-0 space-y-6">

                            {/* Tracking Card */}
                            <div className="sticky top-24 z-10">
                                <TrackGameButton
                                    gameId={game.id}
                                    title={game.title}
                                    thumbnail={game.thumbnail}
                                />

                                <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <Terminal className="w-5 h-5 text-primary" /> Technical Details
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block mb-2">Platforms</span>
                                            <div className="flex flex-wrap gap-2">
                                                {game.platform_list && game.platform_list.length > 0 ? (
                                                    getUniquePlatformGroups(game.platform_list).map((g, i) => (
                                                        <div key={i} title={g.platforms.join(', ')} className="flex items-center gap-1.5 bg-surface-hover border border-border px-2.5 py-1.5 rounded-lg text-sm font-medium">
                                                            <div className="text-primary">{g.icon}</div>
                                                            <span className="truncate max-w-[120px] pt-0.5">{g.name}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-sm text-foreground/70">{game.platform}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border">
                                            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block mb-1">Publisher</span>
                                            {game.publisher_id ? (
                                                <Link href={`/company/${game.publisher_id}`} className="text-sm font-medium hover:text-primary transition-colors hover:underline">
                                                    {game.publisher}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-medium">{game.publisher}</span>
                                            )}
                                        </div>

                                        {game.game_url && (
                                            <div className="pt-4 border-t border-border mt-4">
                                                <a href={game.game_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors">
                                                    <Globe2 className="w-4 h-4" /> Visit Official Page
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </>
    );
}
