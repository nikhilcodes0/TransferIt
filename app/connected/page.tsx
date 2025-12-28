"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { extractPlaylistId } from "@/lib/youtube";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import spotify from "@/public/green-spotify.png"
import ytmusic from "@/public/youtube-music.svg"
import Image from "next/image";

export default function ConnectedPage() {
    const router = useRouter();
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Check if user is connected to Spotify
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const res = await fetch("/api/spotify/me");
                if (res.ok) {
                    setIsConnected(true);
                } else {
                    router.push("/");
                }
            } catch {
                router.push("/");
            }
        };
        checkConnection();
    }, [router]);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPlaylistUrl(text);
            setError(null);
        } catch {
            setError("Failed to read clipboard");
        }
    };

    const handleAnalyze = () => {
        if (!playlistUrl.trim()) {
            setError("Please enter a playlist URL");
            return;
        }

        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
            setError("Invalid YouTube playlist URL. Please check and try again.");
            return;
        }

        router.push(`/transfer?playlistId=${playlistId}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleAnalyze();
        }
    };

    if (!isConnected) {
        return (
            <div className="bg-nord-bg min-h-screen flex items-center justify-center">
                <div className="animate-spin size-8 border-2 border-nord-frost2 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="bg-nord-bg font-display min-h-screen flex flex-col text-nord-subtext overflow-x-hidden">
            <Header showLogout />

            <main className="flex-grow flex flex-col items-center justify-center p-6 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nord-frost2/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-nord-frost4/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="w-full max-w-2xl z-10 flex flex-col gap-6">
                    {/* Connection Status Card */}
                    <ConnectionStatusCard
                        playlistUrl={playlistUrl}
                        setPlaylistUrl={setPlaylistUrl}
                        error={error}
                        setError={setError}
                        onPaste={handlePaste}
                        onAnalyze={handleAnalyze}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Activity Log */}
                    <ActivityLog />
                </div>
            </main>

            <Footer />
        </div>
    );
}

// Connection Status Card Component
interface ConnectionStatusCardProps {
    playlistUrl: string;
    setPlaylistUrl: (url: string) => void;
    error: string | null;
    setError: (error: string | null) => void;
    onPaste: () => void;
    onAnalyze: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function ConnectionStatusCard({
    playlistUrl,
    setPlaylistUrl,
    error,
    setError,
    onPaste,
    onAnalyze,
    onKeyDown,
}: ConnectionStatusCardProps) {
    return (
        <div className="bg-nord-surface border border-nord-surface-highlight/50 rounded-2xl shadow-2xl p-1 overflow-hidden">
            {/* Status Header */}
            <div className="bg-nord-bg/50 px-6 py-4 border-b border-nord-surface-highlight/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-nord-frost2 text-xl">link</span>
                    <span className="text-sm font-semibold text-nord-subtext uppercase tracking-wider">
                        Connection Status
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-nord-green animate-pulse-ring"></div>
                    <span className="text-nord-green text-sm font-medium">Active</span>
                </div>
            </div>

            <div className="p-6 sm:p-8 flex flex-col gap-8">
                {/* Connected Accounts Visual */}
                <div className="flex items-center justify-center gap-4 sm:gap-8 py-4">
                    {/* Source (YouTube) */}
                    <div className="flex flex-col items-center gap-3 opacity-60">
                        <div className="size-16 rounded-2xl bg-nord-bg flex items-center justify-center border border-nord-surface-highlight shadow-inner">
                            <span className="material-symbols-outlined text-3xl text-red-500"><Image src={ytmusic} alt="YouTube Music" width={24} height={24} /></span>
                        </div>
                        <span className="text-sm font-medium text-nord-subtext">Source</span>
                    </div>

                    {/* Connector Line */}
                    <div className="flex-1 max-w-[120px] flex flex-col items-center gap-1">
                        <div className="w-full h-1 bg-nord-surface-highlight rounded-full overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 w-1/2 bg-nord-frost2/50"></div>
                            <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-nord-frost2 to-transparent w-[30%] animate-shimmer"></div>
                        </div>
                        <span className="material-symbols-outlined text-nord-frost2/80 text-lg">
                            arrow_forward
                        </span>
                    </div>

                    {/* Destination (Spotify - Connected) */}
                    <div className="flex flex-col items-center gap-3 relative group cursor-default">
                        <div className="absolute -top-2 -right-2 size-6 bg-nord-green rounded-full border-4 border-nord-surface flex items-center justify-center z-10 shadow-sm">
                            <span className="material-symbols-outlined text-nord-bg text-xs font-bold">
                                check
                            </span>
                        </div>
                        <div className="size-16 rounded-2xl bg-[#1db954]/10 border-2 border-[#1db954]/50 flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.15)]">
                            <span className="material-symbols-outlined text-3xl text-[#1db954]">
                                <Image src={spotify} alt="Spotify" width={24} height={24} />
                            </span>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-white leading-tight">Spotify</p>
                            <p className="text-xs text-nord-subtext">Connected</p>
                        </div>
                    </div>
                </div>

                {/* Input Section */}
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Ready to transfer</h2>
                        <p className="text-nord-subtext text-base">
                            Paste your YouTube playlist URL below to begin the migration.
                        </p>
                    </div>

                    <div className="group relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-nord-surface-highlight group-focus-within:text-nord-frost2 transition-colors">
                                link
                            </span>
                        </div>
                        <input
                            autoFocus
                            className={`w-full pl-12 pr-20 py-4 bg-nord-bg border rounded-xl text-white placeholder:text-nord-surface-highlight/70 focus:outline-none focus:ring-2 focus:ring-nord-frost2/50 focus:border-nord-frost2 transition-all shadow-inner font-medium ${error ? "border-nord-red" : "border-nord-surface-highlight"
                                }`}
                            placeholder="https://music.youtube.com/playlist?list=..."
                            type="text"
                            value={playlistUrl}
                            onChange={(e) => {
                                setPlaylistUrl(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={onKeyDown}
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <button
                                onClick={onPaste}
                                className="p-2 text-xs font-semibold bg-nord-surface-highlight/30 hover:bg-nord-surface-highlight/50 text-nord-subtext rounded-lg transition-colors"
                            >
                                PASTE
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-nord-red flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            {error}
                        </p>
                    )}

                    <button
                        onClick={onAnalyze}
                        className="w-full py-4 font-bold rounded-xl shadow-lg shadow-nord-frost2/20 transition-all transform active:scale-[0.99] hover:brightness-110 flex items-center justify-center gap-2 text-lg mt-2 cursor-pointer bg-nord-frost2 text-nord-bg"
                    >
                        <span>Analyze Playlist</span>
                        <span className="material-symbols-outlined icon-filled">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Card Footer */}
            <div className="bg-nord-bg px-6 py-3 border-t border-nord-surface-highlight/30 flex justify-between items-center text-xs text-nord-subtext">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <span>End-to-end encrypted transfer</span>
                </div>
                <span>v2.4.0</span>
            </div>
        </div>
    );
}

// Activity Log Component
function ActivityLog() {
    return (
        <div className="bg-nord-surface/50 border border-nord-surface-highlight/30 rounded-xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-nord-subtext uppercase tracking-wider">
                    Activity Log
                </h3>
                <button className="text-xs text-nord-frost2 hover:text-white transition-colors">
                    Clear
                </button>
            </div>
            <div className="space-y-2 font-mono text-xs">
                <div className="flex items-start gap-3 opacity-50">
                    <span className="text-nord-surface-highlight">{new Date().toLocaleTimeString()}</span>
                    <span className="text-nord-subtext">Initializing OAuth handshake...</span>
                </div>
                <div className="flex items-start gap-3 opacity-70">
                    <span className="text-nord-surface-highlight">{new Date().toLocaleTimeString()}</span>
                    <span className="text-nord-subtext">Token exchange successful.</span>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-nord-surface-highlight">{new Date().toLocaleTimeString()}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-nord-green">Spotify connection established.</span>
                        <span className="material-symbols-outlined text-[10px] text-nord-green">
                            check_circle
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
