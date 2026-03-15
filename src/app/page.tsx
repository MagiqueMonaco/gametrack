import { Suspense } from "react";
import Header from "@/components/Header";
import GameCarousel from "@/components/GameCarousel";
import FeaturedHero from "@/components/FeaturedHero";
import GenreHighlights from "@/components/GenreHighlights";
import CategoryColumns from "@/components/CategoryColumns";
import GameGridSection from "@/components/GameGridSection";
import TopRatedList from "@/components/TopRatedList";
import LoadingGrid from "@/components/LoadingGrid";
import type { Game } from "@/components/GameCard";

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

export default async function Home() {
  const featuredGames = await getGames('anticipated', 5);

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 lg:px-8">
        
        {/* Featured Hero Carousel replaces text header */}
        <FeaturedHero games={featuredGames} />

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Most Anticipated" category="anticipated" limit={20} viewAllLink="/search?category=anticipated" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameSection title="Trending Now" category="trending" limit={20} viewAllLink="/search?category=trending" />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GenreHighlights />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <CategoryColumns />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <TopRatedList />
        </Suspense>

        <Suspense fallback={<LoadingGrid />}>
          <GameGridSection title="Indie Discoveries" category="indie" limit={10} />
        </Suspense>
      </main>
    </>
  );
}
