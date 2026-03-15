'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useLibraryStore, TrackedGame, GameStatus } from '@/store/useLibraryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useClientMounted } from '@/lib/useClientMounted';
import Header from '@/components/Header';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Upload, Trash2, Search, Filter, CloudUpload, CloudDownload, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LibraryPage() {
    const mounted = useClientMounted();
    const { games, removeGame, updateStatus, updatePlaytime, importLibrary, syncToServer, syncFromServer, isSyncing, lastSyncedAt } = useLibraryStore();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<GameStatus | 'All'>('All');
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Clear sync message after 3 seconds
    useEffect(() => {
        if (syncMessage) {
            const timer = setTimeout(() => setSyncMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [syncMessage]);

    const handleSyncToServer = async () => {
        const ok = await syncToServer();
        setSyncMessage(ok
            ? { type: 'success', text: `${games.length} games synced to cloud` }
            : { type: 'error', text: 'Failed to sync. Are you logged in?' }
        );
    };

    const handleSyncFromServer = async () => {
        const ok = await syncFromServer();
        setSyncMessage(ok
            ? { type: 'success', text: 'Library loaded from cloud' }
            : { type: 'error', text: 'Failed to load. Are you logged in?' }
        );
    };

    const handleExportCSV = () => {
        // CSV Header
        const headers = ['id', 'title', 'thumbnail', 'status', 'playtime', 'addedAt'];
        // CSV Rows
        const rows = games.map(g => [
            g.id,
            `"${g.title.replace(/"/g, '""')}"`, // escape quotes for CSV
            g.thumbnail,
            g.status,
            g.playtime,
            g.addedAt
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `gametrack_library_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvData = event.target?.result as string;
            if (!csvData) return;

            const lines = csvData.split('\n');
            if (lines.length < 2) return; // Need at least header + 1 row

            const importedGames: TrackedGame[] = [];

            // Simple CSV parser (doesn't handle commas within quotes perfectly in all cases, but works for our simple export format)
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                // This regex handles parsing CSV lines containing values wrapped in quotes
                const match = lines[i].match(/(\".*?\"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (!match || match.length < 6) continue;

                const cleanValues = match.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));

                importedGames.push({
                    id: parseInt(cleanValues[0]),
                    title: cleanValues[1],
                    thumbnail: cleanValues[2],
                    status: cleanValues[3] as GameStatus,
                    playtime: parseFloat(cleanValues[4]),
                    addedAt: parseInt(cleanValues[5])
                });
            }

            if (importedGames.length > 0) {
                // Confirm before overwriting
                if (confirm(`Import ${importedGames.length} games? This will overwrite your current library.`)) {
                    importLibrary(importedGames);
                }
            }

            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };

        reader.readAsText(file);
    };

    const hasCheckedSync = useRef(false);
    const [showSyncPrompt, setShowSyncPrompt] = useState(false);

    const runInitialSyncCheck = useEffectEvent(async () => {
        if (games.length > 0 && !lastSyncedAt) {
            setShowSyncPrompt(true);
            return;
        }

        if (games.length === 0) {
            await handleSyncFromServer();
        }
    });

    // Initial sync check when logging in
    useEffect(() => {
        if (user && mounted && !hasCheckedSync.current) {
            hasCheckedSync.current = true;
            void runInitialSyncCheck();
        }
    }, [user, mounted, games.length, lastSyncedAt]);

    const handlePromptChoice = async (choice: 'push' | 'pull') => {
        setShowSyncPrompt(false);
        if (choice === 'push') {
            await handleSyncToServer();
        } else {
            await handleSyncFromServer();
        }
    };

    if (!mounted) {
        return (
            <>
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-12 w-64 bg-surface rounded-xl border border-border"></div>
                        <div className="h-20 w-full bg-surface rounded-xl border border-border"></div>
                    </div>
                </main>
            </>
        );
    }

    const filteredGames = games
        .filter(g => statusFilter === 'All' || g.status === statusFilter)
        .filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const STATUS_COLORS: Record<GameStatus, string> = {
        'Playing': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'Completed': 'bg-green-500/20 text-green-400 border-green-500/30',
        'Plan to Play': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        'On Hold': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'Dropped': 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
        <>
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">

                <AnimatePresence>
                    {showSyncPrompt && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
                            {/* Backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowSyncPrompt(false)}
                                className="absolute inset-0 bg-background/80 backdrop-blur-md" 
                            />

                            {/* Modal */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                                className="relative z-10 w-full max-w-md bg-surface border border-border/60 rounded-3xl shadow-2xl shadow-primary/20 overflow-hidden p-8"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mb-6 mx-auto">
                                    <CloudUpload className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Sync Your Library</h2>
                                <p className="text-foreground/60 text-sm text-center mb-8">
                                    You have <strong>{games.length}</strong> unsynced games saved locally. Would you like to upload them to the cloud, or pull your existing cloud save?
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handlePromptChoice('push')}
                                        disabled={isSyncing}
                                        className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <CloudUpload className="w-5 h-5" />
                                        Upload Local Games to Cloud (Keep Local)
                                    </button>
                                    <button
                                        onClick={() => handlePromptChoice('pull')}
                                        disabled={isSyncing}
                                        className="w-full py-3.5 bg-surface-hover hover:bg-surface-hover/80 text-foreground font-bold rounded-xl border border-border transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <CloudDownload className="w-5 h-5 text-foreground/60" />
                                        Pull Cloud Save (Overwrite Local)
                                    </button>
                                    <button
                                        onClick={() => setShowSyncPrompt(false)}
                                        className="w-full py-2 text-foreground/50 hover:text-foreground/80 text-sm transition-colors mt-2"
                                    >
                                        Decide Later
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Page Header */}
                <div className="flex z-10 flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold font-sans tracking-tight mb-2">My Library</h1>
                        <p className="text-foreground/60 font-mono text-sm">
                            Tracking {games.length} games total. ({filteredGames.length} showing)
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 border border-border bg-surface hover:bg-surface-hover rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
                            disabled={games.length === 0}
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImportCSV}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 border border-border bg-surface hover:bg-primary hover:border-primary text-foreground hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
                        >
                            <Upload className="w-4 h-4" /> Import CSV
                        </button>
                    </div>
                </div>

                {/* Cloud Sync Banner (only when logged in) */}
                {user && (
                    <div className="bg-surface border border-border rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                                <CloudUpload className="w-4.5 h-4.5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Cloud Sync</p>
                                <p className="text-xs text-foreground/50">
                                    {lastSyncedAt
                                        ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
                                        : 'Not synced yet'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {syncMessage && (
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                                    syncMessage.type === 'success'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                    {syncMessage.type === 'success' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                                    {syncMessage.text}
                                </span>
                            )}
                            <button
                                onClick={handleSyncToServer}
                                disabled={isSyncing || games.length === 0}
                                className="px-3 py-2 border border-border bg-surface hover:bg-surface-hover rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold disabled:opacity-40"
                            >
                                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                                Push to Cloud
                            </button>
                            <button
                                onClick={handleSyncFromServer}
                                disabled={isSyncing}
                                className="px-3 py-2 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold disabled:opacity-40"
                            >
                                {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudDownload className="w-3.5 h-3.5" />}
                                Pull from Cloud
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-surface border border-border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                        <input
                            type="text"
                            placeholder="Search library..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="relative w-full sm:w-48 shrink-0">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as GameStatus | 'All')}
                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
                        >
                            <option value="All">All Statuses</option>
                            {Object.keys(STATUS_COLORS).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Data Grid / Table */}
                {filteredGames.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center p-16 bg-surface border border-border/60 rounded-3xl text-center shadow-lg shadow-black/5"
                    >
                        <div className="w-20 h-20 bg-background rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-border/30">
                            <Search className="w-10 h-10 text-foreground/30" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 tracking-tight">No Games Found</h2>
                        <p className="text-foreground/50 max-w-sm">
                            {games.length === 0 ? "You haven't added any games to your library yet. Go find some!" : "No games match your current filters."}
                        </p>
                        {games.length > 0 && (
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                                className="mt-8 px-6 py-2.5 bg-surface-hover hover:bg-primary/10 text-foreground hover:text-primary rounded-xl transition-all font-semibold flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" /> Clear Filters
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredGames.map((game, index) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                    transition={{ duration: 0.3, type: "spring", bounce: 0.2, delay: index * 0.05 }}
                                    key={game.id} 
                                    className="bg-surface rounded-2xl border border-border/60 overflow-hidden flex shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all group"
                                >
                                    <Link href={`/game/${game.id}`} className="w-1/3 shrink-0 relative overflow-hidden bg-background">
                                        <Image
                                            src={game.thumbnail}
                                            alt={game.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                            unoptimized={game.thumbnail.includes('nocover')}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface/90 pointer-events-none" />
                                    </Link>
                                    <div className="p-5 flex flex-col flex-1 w-2/3 relative z-10">
                                        <Link href={`/game/${game.id}`} className="font-bold text-lg mb-1 truncate group-hover:text-primary transition-colors pr-6">
                                            {game.title}
                                        </Link>
                                        <div className="text-[11px] text-foreground/50 font-mono mb-4 uppercase tracking-wider">
                                            Added {new Date(game.addedAt).toLocaleDateString()}
                                        </div>

                                        <div className="mt-auto space-y-4">
                                            <div className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                                                Status
                                                <select
                                                    value={game.status}
                                                    onChange={(e) => updateStatus(game.id, e.target.value as GameStatus)}
                                                    className={`text-sm py-1.5 px-3 rounded-lg border appearance-none normal-case tracking-normal cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all ${STATUS_COLORS[game.status]}`}
                                                >
                                                    {Object.keys(STATUS_COLORS).map(s => (
                                                        <option key={s} value={s} className="bg-surface text-foreground">{s}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-border/50 pt-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-widest">Playtime</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={game.playtime || ''}
                                                            onChange={(e) => updatePlaytime(game.id, Number(e.target.value))}
                                                            placeholder="0"
                                                            className="bg-surface-hover border border-border/50 rounded-lg px-2 py-1 w-16 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-center"
                                                        /> 
                                                        <span className="text-xs text-foreground/40 font-mono">hrs</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => removeGame(game.id)}
                                                    className="text-foreground/30 hover:text-red-400 transition-colors bg-surface-hover/50 p-2 rounded-xl border border-transparent hover:border-red-400/20 hover:bg-red-400/10 active:scale-95"
                                                    title="Remove from library"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>
        </>
    );
}
