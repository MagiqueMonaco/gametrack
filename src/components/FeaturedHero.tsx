'use client';

import { useState, useEffect, useEffectEvent, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from './GameCard';
import { ChevronRight, ChevronLeft, Star } from 'lucide-react';

interface FeaturedHeroProps {
    games: Game[];
}

export default function FeaturedHero({ games }: FeaturedHeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Only include games that have true wide artwork (not undefined/nocover)
    const validGames = games.filter(g => g.artwork && !g.artwork.includes('nocover')).slice(0, 5);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % validGames.length);
    };
    const autoAdvanceSlide = useEffectEvent(() => {
        nextSlide();
    });
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + validGames.length) % validGames.length);

    useEffect(() => {
        if (validGames.length <= 1 || isHovering) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        
        timerRef.current = setInterval(() => autoAdvanceSlide(), 7000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [validGames.length, isHovering]);

    if (!validGames.length) return null;

    const game = validGames[currentIndex];

    return (
        <div 
            className="relative w-full h-[50vh] md:h-[70vh] min-h-[400px] max-h-[800px] overflow-hidden rounded-3xl mb-12 md:mb-16 shadow-2xl group border border-white/10"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <Image
                        src={game.artwork || game.thumbnail}
                        alt={game.title}
                        fill
                        className="object-cover object-top"
                        priority
                    />
                    {/* Dark gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 md:via-background/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
                </motion.div>
            </AnimatePresence>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end xl:justify-center p-6 md:p-12 lg:p-20 z-10 w-full md:w-2/3 lg:w-1/2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col gap-4"
                    >
                        {/* Tags */}
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase bg-primary text-white rounded-md shadow-lg shadow-primary/20">
                                Featured
                            </span>
                            {game.rating && (
                                <span className="flex items-center gap-1 text-sm font-bold text-yellow-500 drop-shadow-md bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                                    <Star className="w-4 h-4 fill-current" /> {game.rating.toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg line-clamp-2">
                            {game.title}
                        </h1>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-white/70 text-sm md:text-base font-medium">
                            <span className="truncate max-w-[150px] md:max-w-none">{game.developer}</span>
                            <span>•</span>
                            <span>{game.release_date !== 'TBD' ? new Date(game.release_date).getFullYear() : 'Upcoming'}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px] md:max-w-none">{game.genre}</span>
                        </div>

                        {/* Description */}
                        <p className="text-white/80 text-sm md:text-lg line-clamp-2 md:line-clamp-3 max-w-xl drop-shadow-md">
                            {game.short_description}
                        </p>

                        {/* CTA */}
                        <div className="mt-4 md:mt-6">
                            <Link 
                                href={`/game/${game.id}`}
                                className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-white text-black hover:bg-white/90 font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                            >
                                View Game <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-6 md:left-12 lg:left-20 flex items-center gap-2 z-20">
                {validGames.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`transition-all duration-300 rounded-full ${
                            i === currentIndex 
                            ? 'w-8 h-2 bg-primary shadow-[0_0_10px_rgba(168,85,247,0.8)]' 
                            : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Manual Navigation Arrows */}
            {validGames.length > 1 && (
                <>
                    <button 
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white/50 border border-white/10 opacity-0 group-hover:opacity-100 group-hover:text-white hover:bg-black/50 hover:scale-110 transition-all duration-300 z-30"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-8 h-8 -ml-1" />
                    </button>
                    <button 
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white/50 border border-white/10 opacity-0 group-hover:opacity-100 group-hover:text-white hover:bg-black/50 hover:scale-110 transition-all duration-300 z-30"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-8 h-8 ml-1" />
                    </button>
                </>
            )}
        </div>
    );
}
