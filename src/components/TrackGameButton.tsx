'use client';

import { useLibraryStore, GameStatus } from '@/store/useLibraryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useClientMounted } from '@/lib/useClientMounted';
import { BookmarkPlus, BookmarkCheck, Clock, Trash2 } from 'lucide-react';

interface Props {
    gameId: number;
    title: string;
    thumbnail: string;
}

export default function TrackGameButton({ gameId, title, thumbnail }: Props) {
    const mounted = useClientMounted();
    const { games, addGame, removeGame, updateStatus, updatePlaytime } = useLibraryStore();
    const { user } = useAuthStore();

    if (!mounted) {
        return (
            <div className="h-40 w-full animate-pulse bg-surface-hover rounded-xl border border-border"></div>
        );
    }

    const trackedGame = games.find(g => g.id === gameId);
    const isTracked = !!trackedGame;

    const handleAdd = async () => {
        addGame({
            id: gameId,
            title,
            thumbnail,
            status: 'Plan to Play',
            playtime: 0
        });

        // Sync to server if logged in
        if (user) {
            try {
                await fetch(`/api/library/${gameId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        thumbnail,
                        status: 'Plan to Play',
                        playtime: 0,
                        added_at: Date.now(),
                    }),
                });
            } catch {
                // Silently fail — local state is still updated
            }
        }
    };

    const handleRemove = async () => {
        removeGame(gameId);
        if (user) {
            try {
                await fetch(`/api/library/${gameId}`, { method: 'DELETE' });
            } catch { /* silent */ }
        }
    };

    const handleStatusChange = async (status: GameStatus) => {
        updateStatus(gameId, status);
        if (user && trackedGame) {
            try {
                await fetch(`/api/library/${gameId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: trackedGame.title,
                        thumbnail: trackedGame.thumbnail,
                        status,
                        playtime: trackedGame.playtime,
                        added_at: trackedGame.addedAt,
                    }),
                });
            } catch { /* silent */ }
        }
    };

    const handlePlaytimeChange = async (playtime: number) => {
        updatePlaytime(gameId, playtime);
        if (user && trackedGame) {
            try {
                await fetch(`/api/library/${gameId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: trackedGame.title,
                        thumbnail: trackedGame.thumbnail,
                        status: trackedGame.status,
                        playtime,
                        added_at: trackedGame.addedAt,
                    }),
                });
            } catch { /* silent */ }
        }
    };

    const STATUS_OPTIONS: GameStatus[] = ['Playing', 'Completed', 'On Hold', 'Dropped', 'Plan to Play'];

    if (!isTracked) {
        return (
            <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] font-bold text-lg"
            >
                <BookmarkPlus className="w-5 h-5" />
                Add to Library
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-4 bg-surface rounded-xl p-5 border border-primary/30 shadow-[0_0_30px_rgba(124,58,237,0.05)]">
            <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <BookmarkCheck className="w-5 h-5" />
                    <span>In Your Library</span>
                </div>
                <button
                    onClick={handleRemove}
                    className="text-foreground/50 hover:text-red-500 transition-colors"
                    title="Remove from library"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Dropdown */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Status</label>
                    <select
                        value={trackedGame.status}
                        onChange={(e) => handleStatusChange(e.target.value as GameStatus)}
                        className="bg-surface-hover border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                        {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* Playtime Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Playtime (Hours)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={trackedGame.playtime || ''}
                        onChange={(e) => handlePlaytimeChange(Number(e.target.value))}
                        placeholder="0"
                        className="bg-surface-hover border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
            </div>
        </div>
    );
}
