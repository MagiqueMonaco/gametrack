'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { LayoutGrid, Flame, Trophy, Gem, Crosshair, Map, Zap, Puzzle, Medal, Flag, Swords, Ghost } from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All Games', icon: LayoutGrid },
    { id: 'anticipated', label: 'Anticipated', icon: Flame },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'top', label: 'Top Rated', icon: Trophy },
    { id: 'action', label: 'Action', icon: Zap },
    { id: 'rpg', label: 'RPGs', icon: Gem },
    { id: 'shooter', label: 'Shooters', icon: Crosshair },
    { id: 'adventure', label: 'Adventure', icon: Map },
    { id: 'strategy', label: 'Strategy', icon: Puzzle },
    { id: 'sports', label: 'Sports', icon: Medal },
    { id: 'racing', label: 'Racing', icon: Flag },
    { id: 'fighting', label: 'Fighting', icon: Swords },
    { id: 'indie', label: 'Indie', icon: Ghost },
];

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get('category') || 'all';
    const currentQuery = searchParams.get('q');

    const handleCategorySelect = useCallback(
        (categoryId: string) => {
            const params = new URLSearchParams(searchParams.toString());

            if (categoryId === 'all') {
                params.delete('category');
            } else {
                params.set('category', categoryId);
            }

            // If they select a category, probably clear the search query to show standard categories? 
            // Or keep it? The backend api/search currently only accepts `q`, or api/games accepts `category`. 
            // The Next.js page prioritizes `q` over `category`. 
            // So if a user clicks a category filter, we should delete `q` to ensure the category loads.
            params.delete('q');

            router.push(`/search?${params.toString()}`);
        },
        [router, searchParams]
    );

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                // Also highlight 'all' if there's a search query 
                const isActive = (currentCategory === cat.id && !currentQuery) || (cat.id === 'all' && currentQuery && !searchParams.get('category'));

                return (
                    <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 border ${isActive
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                            : 'bg-surface hover:bg-surface-hover text-foreground/70 hover:text-foreground border-border'
                            }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                        {cat.label}
                    </button>
                );
            })}
        </div>
    );
}
