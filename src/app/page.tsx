import { Suspense } from "react";
import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import GameCarousel from "@/components/GameCarousel";
import LoadingGrid from "@/components/LoadingGrid";
import { Game } from "@/components/GameCard";

export const dynamic = 'force-dynamic';

async function getGames(category: string, limit: number): Promise<Game[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/games?category=${category}&limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error("Failed to fetch games");
    return res.json();
  } catch (error) {
    console.error(`Error fetching games for ${category}:`, error);
    return [];
  }
}

async function GameSection({ title, category, limit = 20, viewAllLink }: { title: string, category: string, limit?: number, viewAllLink?: string }) {
  const games = await getGames(category, limit);

  if (!games || games.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 md:mb-14">
      <div className="flex items-end justify-between mb-4 md:mb-6 text-foreground pb-2 border-b-2 border-border/40">
        <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white/90">{title}</h2>
        {viewAllLink && (
          <a href={viewAllLink} className="text-xs md:text-sm font-bold tracking-widest uppercase text-primary hover:text-primary-hover hover:underline transition-colors pb-1">
            View All
          </a>
        )}
      </div>

      <GameCarousel games={games} />
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 lg:px-8">
        <div className="relative mb-12 md:mb-20 text-center pt-12 md:pt-20 pb-4">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-10" />
          
          <h1 className="text-5xl md:text-7xl font-sans font-extrabold tracking-tight mb-4 md:mb-6 text-foreground/90 leading-tight">
            Discover <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Amazing</span> Games
          </h1>
          <p className="text-base md:text-xl text-foreground/60 max-w-2xl mx-auto font-medium tracking-wide">
            Your premium tracklist of the very best titles available right now.
          </p>
        </div>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Most Anticipated" category="anticipated" limit={20} viewAllLink="/search?category=anticipated" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Trending Now" category="trending" limit={20} viewAllLink="/search?category=trending" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Highest Rated" category="top" limit={20} viewAllLink="/search?category=top" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Action & Adventure" category="action" limit={20} viewAllLink="/search?category=action" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Role-Playing Games" category="rpg" limit={20} viewAllLink="/search?category=rpg" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="First-Person & Tactics" category="shooter" limit={20} viewAllLink="/search?category=shooter" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Strategy" category="strategy" limit={20} viewAllLink="/search?category=strategy" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Sports" category="sports" limit={20} viewAllLink="/search?category=sports" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Racing" category="racing" limit={20} viewAllLink="/search?category=racing" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Fighting" category="fighting" limit={20} viewAllLink="/search?category=fighting" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Indie Discoveries" category="indie" limit={20} viewAllLink="/search?category=indie" />
        </Suspense>
      </main>

      <footer className="bg-surface border-t border-border mt-auto py-8 text-center text-foreground/50 text-sm font-mono">
        <p>GameTrack © {new Date().getFullYear()}. Using IGDB API.</p>
      </footer>
    </>
  );
}
