'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { getUniquePlatformGroups } from '@/lib/platformIcons';
import { AGE_RATING_DESCRIPTIONS } from '@/lib/ratings';

export interface Game {
    id: number;
    title: string;
    thumbnail: string;
    short_description: string;
    game_url: string;
    genre: string;
    platform: string;
    publisher: string;
    developer: string;
    developer_id?: number;
    release_date: string;
    freetogame_profile_url: string;
    rating?: number | null;
    age_rating?: string | null;
}

interface GameCardProps {
    game: Game;
    index: number;
}

export default function GameCard({ game, index }: GameCardProps) {
    const platformStrings = game.platform.split(',').map(p => p.trim());
    const uniqueGroups = getUniquePlatformGroups(platformStrings);
    const displayGroups = uniqueGroups.slice(0, 3);
    const excess = uniqueGroups.length > 3 ? uniqueGroups.length - 3 : 0;
    
    // Fallback release year
    const releaseYear = game.release_date !== 'TBD' ? new Date(game.release_date).getFullYear() : 'TBD';

    return (
        <motion.a
            href={`/game/${game.id}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "50px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group relative flex flex-col w-full aspect-[3/4] bg-surface rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 transition-colors shadow-lg shadow-black/20"
        >
            {/* Main Cover Art */}
            <Image
                src={game.thumbnail}
                alt={game.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 640px) 150px, (max-width: 768px) 180px, 200px"
                unoptimized={game.thumbnail.includes('nocover')}
            />

            {/* Permanent Bottom Dark Gradient - Ensures text is always readable */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
            
            {/* Sliding Hover Overlay - Darkens the whole card slightly on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Base Info (Title & Year) - Always visible at bottom */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex flex-col justify-end z-10 transition-transform duration-300 group-hover:-translate-y-10 group-focus:-translate-y-10">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white/95 line-clamp-1 drop-shadow-md">
                        {game.title}
                    </h3>
                    {game.rating && (
                        <span className="shrink-0 text-[10px] sm:text-[11px] font-bold text-yellow-500 flex items-center gap-0.5 drop-shadow-md">
                            ⭐{game.rating.toFixed(1)}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center justify-between mt-1 text-[10px] sm:text-xs text-white/60 font-medium">
                    <span className="truncate max-w-[70%]">{game.genre}</span>
                    <span>{releaseYear}</span>
                </div>
            </div>

            {/* Hidden Metadata Info - Slides up from bottom on hover */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-focus:opacity-100 group-focus:translate-y-0 transition-all duration-300 z-10 hidden sm:flex flex-col">
                <div className="flex items-center justify-between w-full mt-auto text-white/80">
                    <div className="flex items-center gap-1">
                        {displayGroups.map((g, i) => (
                            <div key={i} title={g.platforms.join(', ')} className="drop-shadow-sm scale-90 sm:scale-100">
                                {g.icon}
                            </div>
                        ))}
                        {excess > 0 && (
                            <span className="text-[9px] font-bold">+{excess}</span>
                        )}
                    </div>
                    
                    {game.age_rating && (
                        <span
                            title={AGE_RATING_DESCRIPTIONS[game.age_rating] || game.age_rating}
                            className="px-1.5 py-0.5 text-[9px] font-bold border border-white/20 rounded text-center bg-black/50 backdrop-blur-sm truncate max-w-[60px]"
                        >
                            {game.age_rating}
                        </span>
                    )}
                </div>
            </div>

            {/* Premium Inner Ring Glow */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-primary/40 transition-all duration-300 pointer-events-none z-20" />
        </motion.a>
    );
}
