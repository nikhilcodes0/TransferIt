"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

type YouTubeItem = {
    videoId: string;
    title: string;
    channelTitle: string;
};

type PlaylistData = {
    playlistName: string;
    items: YouTubeItem[];
};

type LogEntry = {
    title: string;
    status: "matched" | "skipped" | "processing";
    spotifyTrack?: string;
    spotifyArtist?: string;
    skipReason?: string;
};

type TransferState =
    | { step: "loading" }
    | { step: "ready"; playlist: PlaylistData }
    | { step: "transferring"; playlist: PlaylistData; current: number; total: number; logs: LogEntry[] }
    | { step: "complete"; playlistUrl: string; added: number; skipped: number; logs: LogEntry[] }
    | { step: "error"; message: string };

function TransferContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const playlistId = searchParams.get("playlistId");

    const [state, setState] = useState<TransferState>({ step: "loading" });
    const logsContainerRef = useRef<HTMLDivElement>(null);

    // Fetch YouTube playlist data on mount
    useEffect(() => {
        if (!playlistId) {
            setState({ step: "error", message: "No playlist ID provided" });
            return;
        }

        async function fetchPlaylist() {
            try {
                const res = await fetch(`/api/youtube/playlist?playlistId=${playlistId}`);
                const data = await res.json();

                if (data.error) {
                    setState({ step: "error", message: data.error });
                    return;
                }

                setState({
                    step: "ready",
                    playlist: {
                        playlistName: data.playlistName,
                        items: data.items,
                    },
                });
            } catch {
                setState({ step: "error", message: "Failed to fetch playlist data" });
            }
        }

        fetchPlaylist();
    }, [playlistId]);

    // Auto-scroll logs
    useEffect(() => {
        if (logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [state]);

    const startTransfer = async () => {
        if (state.step !== "ready") return;

        const playlist = state.playlist;

        setState({
            step: "transferring",
            playlist,
            current: 0,
            total: playlist.items.length,
            logs: [],
        });

        try {
            const response = await fetch("/api/spotify/transfer-stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: playlist.items,
                    playlistName: playlist.playlistName,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 401) {
                    // Not authenticated, redirect to Spotify auth
                    window.location.href = "/api/auth/spotify";
                    return;
                }
                setState({ step: "error", message: error.error || "Transfer failed" });
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                setState({ step: "error", message: "Failed to read response stream" });
                return;
            }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === "progress") {
                                setState((prev) => {
                                    if (prev.step !== "transferring") return prev;

                                    const newLog: LogEntry = {
                                        title: data.title,
                                        status: data.status,
                                        spotifyTrack: data.spotifyTrack,
                                        spotifyArtist: data.spotifyArtist,
                                        skipReason: data.skipReason,
                                    };

                                    return {
                                        ...prev,
                                        current: data.current,
                                        total: data.total,
                                        logs: [...prev.logs, newLog],
                                    };
                                });
                            } else if (data.type === "complete") {
                                setState((prev) => {
                                    if (prev.step !== "transferring") return prev;
                                    return {
                                        step: "complete",
                                        playlistUrl: data.playlistUrl,
                                        added: data.added,
                                        skipped: data.skipped,
                                        logs: prev.logs,
                                    };
                                });
                            } else if (data.type === "error") {
                                setState({ step: "error", message: data.message });
                            }
                        } catch (e) {
                            console.error("Failed to parse SSE data:", line);
                        }
                    }
                }
            }
        } catch {
            setState({ step: "error", message: "Connection error during transfer" });
        }
    };

    const getProgress = () => {
        if (state.step === "transferring") {
            return Math.round((state.current / state.total) * 100);
        }
        if (state.step === "complete") {
            return 100;
        }
        return 0;
    };

    const getStepStatus = (stepNum: number) => {
        if (state.step === "loading") return stepNum === 1 ? "active" : "pending";
        if (state.step === "ready") return stepNum === 1 ? "complete" : "pending";
        if (state.step === "transferring") {
            if (stepNum === 1) return "complete";
            if (stepNum === 2) return "active";
            return "pending";
        }
        if (state.step === "complete") return "complete";
        return "pending";
    };

    const getPlaylistItemCount = () => {
        if (state.step === "ready") return state.playlist.items.length;
        if (state.step === "transferring") return state.playlist.items.length;
        return 0;
    };

    return (
        <div className="bg-nord-bg text-nord-subtext font-display overflow-x-hidden min-h-screen flex flex-col">
            {/* Global styles for shimmer animation */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .shimmer-effect {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>

            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-nord-surface px-6 md:px-10 py-3 bg-nord-bg relative z-10">
                <div className="flex items-center gap-4">
                    <div className="size-8 flex items-center justify-center text-nord-frost2">
                        <span className="material-symbols-outlined text-3xl">queue_music</span>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-nord-snow3">
                        Playlist Transfer
                    </h2>
                </div>
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-nord-subtext hover:text-white hover:bg-nord-surface transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Back
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative">
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nord-frost2/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col max-w-[640px] w-full z-0">
                    <div className="bg-nord-light rounded-xl shadow-xl border border-nord-surface overflow-hidden">
                        {/* Header Section */}
                        <div className="p-6 sm:p-8 border-b border-nord-bg flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-nord-red/10 text-nord-red">
                                        YouTube
                                    </span>
                                    <span className="material-symbols-outlined text-xs text-nord-highlight">
                                        arrow_forward
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-nord-green/10 text-nord-green">
                                        Spotify
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-nord-snow3">
                                    {state.step === "loading" && "Loading playlist..."}
                                    {state.step === "ready" && state.playlist.playlistName}
                                    {state.step === "transferring" && state.playlist.playlistName}
                                    {state.step === "complete" && "Transfer Complete!"}
                                    {state.step === "error" && "Transfer Failed"}
                                </h1>
                                <p className="text-nord-subtext/70 text-sm font-medium">
                                    {state.step === "loading" && "Fetching playlist data..."}
                                    {state.step === "ready" && `${state.playlist.items.length} tracks ready to transfer`}
                                    {state.step === "transferring" && `Processing track ${state.current} of ${state.total}`}
                                    {state.step === "complete" && `${state.added} tracks added, ${state.skipped} skipped`}
                                    {state.step === "error" && state.message}
                                </p>
                            </div>
                        </div>

                        {/* Start Transfer Button - Prominent placement for ready state */}
                        {state.step === "ready" && (
                            <div className="px-6 sm:px-8 py-6 border-b border-nord-surface">
                                <button
                                    onClick={startTransfer}
                                    style={{
                                        backgroundColor: "#88c0d0",
                                        color: "#2e3440",
                                    }}
                                    className="w-full flex items-center justify-center gap-3 font-bold text-lg py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:brightness-110 active:brightness-95 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-2xl">play_arrow</span>
                                    Start Transfer
                                </button>
                            </div>
                        )}

                        {/* Progress Section - Only show during/after transfer */}
                        {(state.step === "transferring" || state.step === "complete") && (
                            <div className="px-6 sm:px-8 py-6 border-b border-nord-bg">
                                {/* Progress Bar */}
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-nord-subtext font-medium">Progress</span>
                                    <span className="text-nord-frost2 font-bold">{getProgress()}%</span>
                                </div>
                                <div className="w-full bg-nord-bg rounded-full h-3 overflow-hidden ring-1 ring-inset ring-white/5">
                                    <div
                                        className="bg-nord-frost2 h-full rounded-full transition-all duration-300 ease-out relative"
                                        style={{ width: `${getProgress()}%` }}
                                    >
                                        {state.step === "transferring" && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer-effect" />
                                        )}
                                    </div>
                                </div>

                                {/* Log output */}
                                <div
                                    ref={logsContainerRef}
                                    className="mt-4 w-full bg-nord-bg rounded-lg p-4 font-mono text-sm border border-nord-surface shadow-inner h-[200px] overflow-y-auto"
                                >
                                    {(state.step === "transferring" ? state.logs : state.logs).map((log, i) => (
                                        <div
                                            key={i}
                                            className="py-0.5"
                                            style={{
                                                color: log.status === "matched"
                                                    ? "#a3be8c"
                                                    : log.status === "skipped"
                                                        ? "#bf616a"
                                                        : "#88c0d0"
                                            }}
                                        >
                                            <span className="inline-block w-5">
                                                {log.status === "matched" ? "✓" : log.status === "skipped" ? "✗" : "›"}
                                            </span>
                                            {log.status === "matched" && log.spotifyTrack
                                                ? `${log.spotifyTrack} - ${log.spotifyArtist}`
                                                : log.title}
                                            {log.status === "skipped" && log.skipReason && (
                                                <span style={{ color: "#bf616a", opacity: 0.7 }}> ({log.skipReason})</span>
                                            )}
                                        </div>
                                    ))}
                                    {state.step === "transferring" && state.logs.length === 0 && (
                                        <div className="text-nord-highlight animate-pulse">Starting transfer...</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Steps Timeline */}
                        <div className="p-6 sm:p-8 flex flex-col gap-4">
                            {/* Step 1: Fetching */}
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    {getStepStatus(1) === "complete" ? (
                                        <div className="flex items-center justify-center size-8 rounded-full bg-nord-green/20 text-nord-green">
                                            <span className="material-symbols-outlined text-lg">check</span>
                                        </div>
                                    ) : getStepStatus(1) === "active" ? (
                                        <div className="flex items-center justify-center size-8 rounded-full bg-nord-frost2 text-nord-bg">
                                            <span className="material-symbols-outlined text-lg animate-spin" style={{ animationDuration: "2s" }}>sync</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center size-8 rounded-full border-2 border-nord-highlight text-nord-highlight">
                                            <span className="material-symbols-outlined text-lg">download</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-sm font-bold ${getStepStatus(1) === "pending" ? "text-nord-highlight" : "text-nord-snow3"}`}>
                                        Fetch playlist data
                                    </h3>
                                    <p className="text-xs text-nord-subtext/60">
                                        {state.step === "loading" && "Connecting to YouTube..."}
                                        {state.step !== "loading" && state.step !== "error" && `${getPlaylistItemCount()} tracks found`}
                                        {state.step === "error" && "Failed"}
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Matching */}
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    {getStepStatus(2) === "complete" ? (
                                        <div className="flex items-center justify-center size-8 rounded-full bg-nord-green/20 text-nord-green">
                                            <span className="material-symbols-outlined text-lg">check</span>
                                        </div>
                                    ) : getStepStatus(2) === "active" ? (
                                        <div className="flex items-center justify-center size-8 rounded-full bg-nord-frost2 text-nord-bg">
                                            <span className="material-symbols-outlined text-lg animate-spin" style={{ animationDuration: "2s" }}>sync</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center size-8 rounded-full border-2 border-nord-highlight text-nord-highlight">
                                            <span className="material-symbols-outlined text-lg">search</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-sm font-bold ${getStepStatus(2) === "pending" ? "text-nord-highlight" : "text-nord-snow3"}`}>
                                        Match songs on Spotify
                                    </h3>
                                    <p className="text-xs text-nord-subtext/60">
                                        {getStepStatus(2) === "pending" && "Waiting..."}
                                        {getStepStatus(2) === "active" && state.step === "transferring" && `${state.current}/${state.total} processed`}
                                        {getStepStatus(2) === "complete" && "All tracks processed"}
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Creating */}
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    {getStepStatus(3) === "complete" ? (
                                        <div className="flex items-center justify-center size-8 rounded-full bg-nord-green/20 text-nord-green">
                                            <span className="material-symbols-outlined text-lg">check</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center size-8 rounded-full border-2 border-nord-highlight text-nord-highlight">
                                            <span className="material-symbols-outlined text-lg">playlist_add</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-sm font-bold ${getStepStatus(3) === "complete" ? "text-nord-snow3" : "text-nord-highlight"}`}>
                                        Create Spotify playlist
                                    </h3>
                                    <p className="text-xs text-nord-subtext/60">
                                        {state.step === "complete" ? (
                                            <a
                                                href={state.playlistUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-nord-frost2 hover:underline inline-flex items-center gap-1"
                                            >
                                                Open in Spotify
                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </a>
                                        ) : (
                                            "Pending..."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-nord-bg/50 p-4 border-t border-nord-surface flex justify-between items-center">
                            {state.step === "transferring" ? (
                                <p className="text-xs text-nord-highlight flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm animate-pulse">info</span>
                                    Please do not close this tab
                                </p>
                            ) : state.step === "complete" ? (
                                <p className="text-xs text-nord-green flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Transfer completed successfully!
                                </p>
                            ) : state.step === "error" ? (
                                <p className="text-xs text-nord-red flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {state.message}
                                </p>
                            ) : (
                                <p className="text-xs text-nord-highlight">Ready when you are</p>
                            )}

                            {state.step === "complete" ? (
                                <button
                                    onClick={() => router.push("/")}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-nord-frost2 text-nord-bg hover:bg-nord-frost3 transition-colors"
                                >
                                    Transfer Another
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.push("/")}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-nord-subtext hover:text-nord-red hover:bg-nord-red/10 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function TransferProgress() {
    return (
        <Suspense fallback={
            <div className="bg-nord-bg min-h-screen flex items-center justify-center">
                <div className="text-nord-subtext flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Loading...
                </div>
            </div>
        }>
            <TransferContent />
        </Suspense>
    );
}
