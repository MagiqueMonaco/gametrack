'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface GameResult {
    id: number;
    title: string;
    thumbnail: string;
    release_date: string;
    developer: string;
    rating?: number | null;
}

interface CompanyResult {
    id: number;
    name: string;
    logoUrl: string | null;
}

interface SearchSuggestResponse {
    games: GameResult[];
    companies: CompanyResult[];
}

export default function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [results, setResults] = useState<SearchSuggestResponse>({ games: [], companies: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLFormElement>(null);

    // Debounce the query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Fetch suggestions
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults({ games: [], companies: [] });
            setShowDropdown(false);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setShowDropdown(true);
            try {
                const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(debouncedQuery)}&gameLimit=3&companyLimit=2`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Error fetching search suggestions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setShowDropdown(false);
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <form
            ref={wrapperRef}
            onSubmit={handleSubmit}
            className="hidden md:flex relative items-center flex-1 max-w-lg ml-8 mr-4 z-50"
        >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-foreground/50" />
            </div>
            <input
                type="text"
                name="q"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value.trim()) {
                        setShowDropdown(false);
                    }
                }}
                onFocus={() => {
                    if (query.trim() && (results.games.length > 0 || results.companies.length > 0)) {
                        setShowDropdown(true);
                    }
                }}
                placeholder="Search for games, developers, and publishers..."
                autoComplete="off"
                className="w-full bg-surface-hover border border-border rounded-full py-1.5 pl-10 pr-10 text-sm focus:outline-none focus:border-primary transition-colors text-foreground placeholder:text-foreground/50"
            />
            {isLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
            )}

            {/* Dropdown Menu */}
            {showDropdown && (debouncedQuery.trim() !== '') && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
                    {isLoading && results.games.length === 0 && results.companies.length === 0 ? (
                        <div className="p-4 flex items-center justify-center text-foreground/50 text-sm gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                        </div>
                    ) : results.games.length > 0 || results.companies.length > 0 ? (
                        <div className="flex flex-col max-h-[450px] overflow-y-auto">

                            {/* Games Section */}
                            {results.games.length > 0 && (
                                <div className="flex flex-col">
                                    <div className="px-3 py-2 text-xs font-bold text-foreground/50 uppercase tracking-wider bg-surface-hover/50">
                                        Game Titles
                                    </div>
                                    {results.games.map((game) => (
                                        <Link
                                            key={`game-${game.id}`}
                                            href={`/game/${game.id}`}
                                            onClick={() => setShowDropdown(false)}
                                            className="flex items-center gap-3 p-3 hover:bg-surface-hover border-b border-border/50 last:border-0 transition-colors group"
                                        >
                                            <div className="relative w-10 h-14 shrink-0 rounded bg-background overflow-hidden border border-border/50 shadow-sm group-hover:border-primary/50 transition-colors">
                                                <Image
                                                    src={game.thumbnail}
                                                    alt={game.title}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized={game.thumbnail.includes('nocover')}
                                                />
                                            </div>
                                            <div className="flex flex-col flex-1 overflow-hidden">
                                                <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                                    {game.title}
                                                </span>
                                                <span className="text-xs text-foreground/60 truncate flex items-center gap-1.5 mt-0.5">
                                                    {game.rating && (
                                                        <span className="flex items-center text-yellow-500 font-medium">
                                                            ⭐ {game.rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                    {game.rating && <span>•</span>}
                                                    {game.release_date !== 'TBD' ? new Date(game.release_date).getFullYear() : 'TBD'} • {game.developer}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Companies Section */}
                            {results.companies.length > 0 && (
                                <div className="flex flex-col border-t border-border">
                                    <div className="px-3 py-2 text-xs font-bold text-foreground/50 uppercase tracking-wider bg-surface-hover/50">
                                        Developers & Publishers
                                    </div>
                                    {results.companies.map((company) => (
                                        <Link
                                            key={`company-${company.id}`}
                                            href={`/company/${company.id}`}
                                            onClick={() => setShowDropdown(false)}
                                            className="flex items-center gap-3 p-3 hover:bg-surface-hover border-b border-border/50 last:border-0 transition-colors group"
                                        >
                                            <div className="w-10 h-10 shrink-0 rounded-full bg-background overflow-hidden border border-border/50 shadow-sm flex items-center justify-center group-hover:border-primary/50 transition-colors relative">
                                                {company.logoUrl ? (
                                                    <Image
                                                        src={company.logoUrl}
                                                        alt={company.name}
                                                        fill
                                                        className="object-contain p-1"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <span className="text-sm font-bold opacity-30 group-hover:opacity-60 group-hover:text-primary transition-all">
                                                        {company.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                                    {company.name}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <div
                                onClick={handleSubmit}
                                className="p-3 text-center text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer border-t border-border mt-auto transition-colors"
                            >
                                View all results for &quot;{debouncedQuery}&quot;
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 flex flex-col items-center justify-center text-foreground/50 text-sm gap-2">
                            <Gamepad2 className="h-6 w-6 opacity-50" />
                            No results found
                        </div>
                    )}
                </div>
            )}
        </form>
    );
}
