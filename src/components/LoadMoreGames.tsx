'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import GameCard, { Game } from './GameCard';
import { Loader2 } from 'lucide-react';

interface LoadMoreGamesProps {
    initialGames: Game[];
    query: string;
    category: string | null;
}

export default function LoadMoreGames({ initialGames, query, category }: LoadMoreGamesProps) {
    const [games, setGames] = useState<Game[]>(initialGames);
    const [offset, setOffset] = useState(initialGames.length);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialGames.length >= 48); // Assume if initial < 48, there are no more

    const observerRef = useRef<IntersectionObserver | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reset state if query or category changes
        setGames(initialGames);
        setOffset(initialGames.length);
        setHasMore(initialGames.length >= 48);
    }, [initialGames, query, category]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            let endpoint = '/api/games';

            if (query) {
                endpoint = `/api/search?q=${encodeURIComponent(query)}&limit=48&offset=${offset}`;
            } else if (category) {
                endpoint = `/api/games?category=${category}&limit=48&offset=${offset}`;
            } else {
                endpoint = `/api/games?limit=48&offset=${offset}`; // fallback Top games
            }

            const res = await fetch(endpoint);
            if (!res.ok) throw new Error("Failed to fetch more games");

            const newGames: Game[] = await res.json();

            if (newGames.length === 0) {
                setHasMore(false);
            } else {
                setGames((prev) => [...prev, ...newGames]);
                setOffset((prev) => prev + newGames.length);

                // If we got exactly the requested limit (or very close but IGDB filtering removed some), it might be tricky.
                // Assuming we request 48, if we get back 0, we're definitely out of games at this offset.
            }
        } catch (error) {
            console.error("Error loading more games:", error);
            setHasMore(false); // Stop trying on error
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, query, category, offset]);

    useEffect(() => {
        // Basic Intersection Observer setup for infinite scrolling
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            { root: null, rootMargin: '400px', threshold: 0 }
        );

        if (bottomRef.current) {
            observerRef.current.observe(bottomRef.current);
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [hasMore, loading, loadMore]); // loadMore is now a stable callback reference

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                {games.map((game, index) => (
                    <GameCard key={`${game.id}-${index}`} game={game} />
                ))}
            </div>

            {/* Loading Trigger Element */}
            {hasMore && (
                <div ref={bottomRef} className="col-span-full py-12 flex justify-center">
                    {loading && (
                        <div className="flex flex-col items-center gap-2 text-foreground/60">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-sm font-semibold tracking-wider uppercase">Loading More Games...</span>
                        </div>
                    )}
                </div>
            )}

            {!hasMore && games.length > 0 && (
                <div className="col-span-full py-8 text-center text-foreground/40 font-mono text-sm border-t border-border mt-8">
                    You have reached the end of the list.
                </div>
            )}
        </>
    );
}
