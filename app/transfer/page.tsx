"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

    // Navigate to summary page when transfer completes
    useEffect(() => {
        if (state.step === "complete") {
            // Get playlist name from sessionStorage
            const playlistName = sessionStorage.getItem("currentPlaylistName") || "Your Playlist";
            sessionStorage.removeItem("currentPlaylistName");

            // Navigate with essential data as URL params
            // Note: skipped songs are already stored in sessionStorage by the complete handler
            const params = new URLSearchParams({
                name: playlistName,
                url: state.playlistUrl,
                added: String(state.added),
                skipped: String(state.skipped),
            });

            router.push(`/summary?${params.toString()}`);
        }
    }, [state, router]);

    const startTransfer = async () => {
        if (state.step !== "ready") return;

        const playlist = state.playlist;

        // Store playlist name for summary page
        sessionStorage.setItem("currentPlaylistName", playlist.playlistName);

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

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

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

                                    // Store skipped songs now while we have access to logs
                                    const skippedSongs = prev.logs
                                        .filter((log) => log.status === "skipped")
                                        .map((log) => ({
                                            title: log.title,
                                            reason: log.skipReason || "NOT FOUND",
                                        }));

                                    console.log("📋 Transfer complete! Logs count:", prev.logs.length);
                                    console.log("📋 Skipped songs count:", skippedSongs.length);
                                    console.log("📋 Skipped songs:", skippedSongs);

                                    if (skippedSongs.length > 0) {
                                        sessionStorage.setItem("skippedSongs", JSON.stringify(skippedSongs));
                                        console.log("📋 Stored in sessionStorage");
                                    }

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
        if (state.step === "complete") return state.logs.length;
        return 0;
    };

    const getPlaylistName = () => {
        if (state.step === "ready") return state.playlist.playlistName;
        if (state.step === "transferring") return state.playlist.playlistName;
        return "";
    };

    // Get last 3 logs for display
    const getRecentLogs = () => {
        if (state.step === "transferring") {
            return state.logs.slice(-3);
        }
        if (state.step === "complete") {
            return state.logs.slice(-3);
        }
        return [];
    };

    return (
        <div className="bg-nord-bg text-nord-subtext font-display overflow-x-hidden min-h-screen flex flex-col">
            {/* Shimmer animation */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(100%) skewX(-12deg); }
                }
            `}</style>

            <Header showLogout />

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
                                    {state.step === "ready" && getPlaylistName()}
                                    {state.step === "transferring" && `Transferring: ${getPlaylistName()}`}
                                    {state.step === "complete" && "Transfer Complete!"}
                                    {state.step === "error" && "Transfer Failed"}
                                </h1>
                                <p className="text-nord-subtext/70 text-sm font-medium">
                                    {state.step === "loading" && "Fetching playlist data..."}
                                    {state.step === "ready" && `${getPlaylistItemCount()} tracks ready to transfer`}
                                    {state.step === "transferring" && `Processing track ${state.current} of ${state.total}...`}
                                    {state.step === "complete" && `${state.added} tracks added, ${state.skipped} skipped`}
                                    {state.step === "error" && state.message}
                                </p>
                            </div>
                        </div>

                        {/* Steps Section */}
                        <div className="p-6 sm:p-8 flex flex-col gap-6">
                            {/* Step 1: Fetching */}
                            <div className="grid grid-cols-[32px_1fr] gap-x-4">
                                <div className="flex flex-col items-center">
                                    {getStepStatus(1) === "complete" ? (
                                        <div className="flex items-center justify-center size-8 rounded-full bg-nord-green/20 text-nord-green">
                                            <span className="material-symbols-outlined text-lg font-bold">check</span>
                                        </div>
                                    ) : getStepStatus(1) === "active" ? (
                                        <div className="relative flex items-center justify-center size-8">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nord-frost2 opacity-20" />
                                            <div className="relative inline-flex items-center justify-center rounded-full bg-nord-frost2 text-nord-bg size-8 shadow-[0_0_15px_rgba(136,192,208,0.4)]">
                                                <span className="material-symbols-outlined text-lg animate-spin" style={{ animationDuration: "3s" }}>sync</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center size-8 rounded-full border-2 border-nord-highlight text-nord-highlight">
                                            <span className="material-symbols-outlined text-lg">download</span>
                                        </div>
                                    )}
                                    <div className={`w-0.5 h-full min-h-[24px] ${getStepStatus(1) === "complete" ? "bg-nord-green/20" : "bg-nord-surface"}`} />
                                </div>
                                <div className="pb-6">
                                    <h3 className={`text-base font-bold mb-0.5 ${getStepStatus(1) === "pending" ? "text-nord-highlight" : "text-nord-snow3"}`}>
                                        Fetching playlist data
                                    </h3>
                                    <p className="text-sm text-nord-subtext/60">
                                        {state.step === "loading" && "Connecting to YouTube..."}
                                        {state.step !== "loading" && state.step !== "error" && `Found ${getPlaylistItemCount()} tracks in source playlist.`}
                                        {state.step === "error" && "Failed to fetch playlist"}
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Matching */}
                            <div className="grid grid-cols-[32px_1fr] gap-x-4">
                                <div className="flex flex-col items-center">
                                    {getStepStatus(2) === "complete" ? (
                                        <div className="flex items-center justify-center size-8 rounded-full bg-nord-green/20 text-nord-green">
                                            <span className="material-symbols-outlined text-lg font-bold">check</span>
                                        </div>
                                    ) : getStepStatus(2) === "active" ? (
                                        <div className="relative flex items-center justify-center size-8">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nord-frost2 opacity-20" />
                                            <div className="relative inline-flex items-center justify-center rounded-full bg-nord-frost2 text-nord-bg size-8 shadow-[0_0_15px_rgba(136,192,208,0.4)]">
                                                <span className="material-symbols-outlined text-lg animate-spin" style={{ animationDuration: "3s" }}>sync</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center size-8 rounded-full border-2 border-nord-highlight text-nord-highlight">
                                            <span className="material-symbols-outlined text-lg">search</span>
                                        </div>
                                    )}
                                    <div className={`w-0.5 h-full min-h-[24px] ${getStepStatus(2) === "complete" ? "bg-nord-green/20" : "bg-nord-surface"}`} />
                                </div>
                                <div className="pb-6 flex flex-col gap-3">
                                    <div>
                                        <h3 className={`text-base font-bold mb-0.5 ${getStepStatus(2) === "pending" ? "text-nord-highlight" : "text-nord-snow3"}`}>
                                            Matching songs on Spotify
                                        </h3>
                                        <p className={`text-sm font-medium ${getStepStatus(2) === "active" ? "text-nord-frost2" : "text-nord-subtext/60"}`}>
                                            {getStepStatus(2) === "pending" && "Waiting for playlist data..."}
                                            {getStepStatus(2) === "active" && state.step === "transferring" && `Processing track ${state.current} of ${state.total}...`}
                                            {getStepStatus(2) === "complete" && "All tracks processed."}
                                        </p>
                                    </div>

                                    {/* Progress bar - show during transfer or complete */}
                                    {(state.step === "transferring" || state.step === "complete") && (
                                        <>
                                            <div className="w-full bg-nord-bg rounded-full h-2 overflow-hidden ring-1 ring-inset ring-white/5">
                                                <div
                                                    className="bg-nord-frost2 h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                                                    style={{ width: `${getProgress()}%` }}
                                                >
                                                    {state.step === "transferring" && (
                                                        <div
                                                            className="absolute inset-0 bg-white/20 w-full h-full"
                                                            style={{ animation: "shimmer 2s infinite" }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Log output */}
                                            <div
                                                ref={logsContainerRef}
                                                className="mt-2 w-full bg-nord-bg rounded-lg p-3 font-mono text-xs border border-nord-surface shadow-inner max-h-[100px] overflow-hidden flex flex-col justify-end"
                                            >
                                                {getRecentLogs().map((log, i, arr) => {
                                                    const isLast = i === arr.length - 1;
                                                    const opacity = isLast ? 1 : i === arr.length - 2 ? 0.75 : 0.5;

                                                    if (log.status === "matched") {
                                                        return (
                                                            <div key={i} style={{ opacity, color: isLast ? "#a3be8c" : "#d8dee9" }}>
                                                                ✓ Found: {log.spotifyTrack} - {log.spotifyArtist}
                                                            </div>
                                                        );
                                                    } else if (log.status === "skipped") {
                                                        return (
                                                            <div key={i} style={{ opacity, color: "#bf616a" }}>
                                                                ✗ Skipped: {log.title} {log.skipReason && `(${log.skipReason})`}
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div key={i} style={{ color: "#a3be8c" }}>
                                                                &gt; Matching: {log.title}...
                                                            </div>
                                                        );
                                                    }
                                                })}
                                                {state.step === "transferring" && state.logs.length === 0 && (
                                                    <div className="text-nord-frost2">&gt; Starting transfer...</div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Start Transfer button */}
                                    {state.step === "ready" && (
                                        <button
                                            onClick={startTransfer}
                                            style={{
                                                backgroundColor: "#88c0d0",
                                                color: "#2e3440",
                                            }}
                                            className="mt-2 w-full flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:brightness-110 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined">play_arrow</span>
                                            Start Transfer
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Creating Playlist */}
                            <div className="grid grid-cols-[32px_1fr] gap-x-4">
                                <div className="flex flex-col items-center">
                                    {getStepStatus(3) === "complete" ? (
                                        <div className="flex items-center justify-center size-8 rounded-full bg-nord-green/20 text-nord-green">
                                            <span className="material-symbols-outlined text-lg font-bold">check</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center size-8 rounded-full border-2 border-nord-highlight text-nord-highlight">
                                            <span className="material-symbols-outlined text-lg">music_note</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-1">
                                    <h3 className={`text-base font-bold mb-0.5 ${getStepStatus(3) === "complete" ? "text-nord-snow3" : "text-nord-highlight"}`}>
                                        {state.step === "complete" ? "Playlist Created!" : "Creating Spotify playlist"}
                                    </h3>
                                    <p className="text-sm text-nord-subtext/60">
                                        {state.step === "complete" ? (
                                            <a
                                                href={state.playlistUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-nord-frost2 hover:underline flex items-center gap-1"
                                            >
                                                Open in Spotify
                                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            </a>
                                        ) : (
                                            "Pending completion of matching."
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-nord-bg/30 p-4 border-t border-nord-surface flex justify-between items-center">
                            <p className="text-xs text-nord-highlight">
                                {state.step === "transferring" && "Please do not close this tab."}
                                {state.step === "complete" && "Transfer completed successfully!"}
                                {state.step === "ready" && "Ready when you are."}
                                {state.step === "error" && state.message}
                            </p>
                            {state.step !== "complete" ? (
                                <button
                                    onClick={() => router.push("/")}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-nord-subtext hover:text-nord-red hover:bg-nord-red/10 transition-colors"
                                >
                                    Cancel Transfer
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.push("/")}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-nord-frost2 text-nord-bg hover:bg-nord-frost3 transition-colors"
                                >
                                    Transfer Another
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function TransferProgress() {
    return (
        <Suspense fallback={
            <div className="bg-nord-bg min-h-screen flex items-center justify-center">
                <div className="text-nord-subtext flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin" style={{ animationDuration: "3s" }}>sync</span>
                    Loading...
                </div>
            </div>
        }>
            <TransferContent />
        </Suspense>
    );
}
