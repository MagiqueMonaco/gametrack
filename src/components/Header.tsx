'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BookMarked, User, LogOut, Cloud, ChevronDown, Search } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import AuthModal from '@/components/AuthModal';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user, isLoading, logout } = useAuthStore();

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setDropdownOpen(false);
        await logout();
    };

    const shortUuid = user?.uuid ? `${user.uuid.slice(0, 8)}...` : '';

    return (
        <>
            <header className="sticky top-0 z-50 w-full glass">
                <div className="container mx-auto flex min-h-16 items-center px-4 py-3 md:h-16 md:py-0">
                    <div className="flex w-full items-center justify-between gap-3 md:gap-4">
                    <Link href="/" className="flex min-w-0 shrink items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                            GT
                        </div>
                        <span className="hidden text-xl font-bold tracking-tight sm:inline">GameTrack</span>
                    </Link>
                    <SearchBar />

                    <nav className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
                        <Link
                            href="/search"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-surface text-foreground/80 shadow-sm transition-colors hover:border-primary/50 hover:text-primary md:hidden"
                            aria-label="Search"
                        >
                            <Search className="w-4 h-4" />
                        </Link>
                        <Link href="/" className="hidden text-sm font-medium text-foreground/80 transition-colors hover:text-primary sm:inline">
                            Home
                        </Link>
                        <Link
                            href="/library"
                            className="flex items-center gap-1.5 rounded-full border border-border/50 bg-surface px-2.5 py-1.5 text-sm font-medium text-foreground/80 shadow-sm transition-colors hover:border-primary/50 hover:text-primary sm:px-3"
                            aria-label="Library"
                        >
                            <BookMarked className="w-4 h-4" />
                            <span className="hidden sm:inline">Library</span>
                        </Link>

                        {/* Auth Button */}
                        {!isLoading && (
                            user ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2 rounded-full border border-border/50 bg-surface px-2.5 py-1.5 shadow-sm transition-colors hover:border-primary/50 sm:px-3"
                                        aria-label="Account menu"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <span className="hidden text-sm font-mono text-foreground/70 sm:inline">{shortUuid}</span>
                                        <ChevronDown className={`hidden w-3.5 h-3.5 text-foreground/50 transition-transform sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {dropdownOpen && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                                                className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border/60 rounded-xl shadow-2xl shadow-black/20 overflow-hidden z-[100] transform-origin-top-right"
                                            >
                                                <div className="px-4 py-3 border-b border-border/50 bg-surface-hover/30">
                                                    <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider mb-1">Account</p>
                                                    <p className="text-xs font-mono text-primary truncate bg-background p-1.5 rounded-md border border-border/30">{user.uuid}</p>
                                                </div>
                                                <div className="p-1">
                                                    <Link
                                                        href="/library"
                                                        onClick={() => setDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
                                                    >
                                                        <Cloud className="w-4 h-4 text-primary" />
                                                        Manage & Sync Library
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAuthModalOpen(true)}
                                    className="flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-hover sm:px-4"
                                >
                                    <User className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sign In</span>
                                </button>
                            )
                        )}
                    </nav>
                    </div>
                </div>
            </header>

            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
}
