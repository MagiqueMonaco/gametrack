'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GameCard, { Game } from './GameCard';

export default function GameCarousel({ games }: { games: Game[] }) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [games]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            // Scroll by roughly one viewport width minus a little overlap
            const scrollAmount = container.clientWidth * 0.8;
            const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

            container.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative group/carousel">
            {/* Left Gradient Overlay & Button */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-20 transition-opacity duration-300 pointer-events-none flex items-center justify-start ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
            >
                <button
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                    className="pointer-events-auto ml-2 md:-ml-4 p-2 md:p-3 rounded-full bg-surface/80 border border-border/50 text-foreground/80 hover:text-white hover:bg-primary/80 hover:border-primary shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transform -translate-x-4 md:-translate-x-0 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-0 disabled:cursor-not-allowed hidden md:flex"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>

            {/* Right Gradient Overlay & Button */}
            <div
                className={`absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-20 transition-opacity duration-300 pointer-events-none flex items-center justify-end ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
            >
                <button
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                    className="pointer-events-auto mr-2 md:-mr-4 p-2 md:p-3 rounded-full bg-surface/80 border border-border/50 text-foreground/80 hover:text-white hover:bg-primary/80 hover:border-primary shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transform translate-x-4 md:translate-x-0 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-0 disabled:cursor-not-allowed hidden md:flex"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>

            {/* Scrolling Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-5 pb-8 pt-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 md:px-0 scroll-smooth"
            >
                {games.map((game) => (
                    <div key={game.id} className="snap-start shrink-0 w-[130px] sm:w-[150px] md:w-[180px] lg:w-[200px]">
                        <GameCard game={game} />
                    </div>
                ))}
            </div>
        </div>
    );
}
