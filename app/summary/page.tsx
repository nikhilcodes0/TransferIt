"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type SkippedSong = {
    title: string;
    artist?: string;
    reason: string;
};

type SummaryData = {
    playlistName: string;
    playlistUrl: string;
    added: number;
    skipped: number;
    skippedSongs: SkippedSong[];
};

function SummaryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const hasReadSessionStorage = useRef(false);

    // Parse data from URL params
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

    useEffect(() => {
        // Prevent double-read in React Strict Mode
        if (hasReadSessionStorage.current) return;
        hasReadSessionStorage.current = true;

        // Read from URL params
        const playlistName = searchParams.get("name") || "Your Playlist";
        const playlistUrl = searchParams.get("url") || "";
        const added = parseInt(searchParams.get("added") || "0", 10);
        const skipped = parseInt(searchParams.get("skipped") || "0", 10);

        // Get skipped songs from sessionStorage
        let skippedSongs: SkippedSong[] = [];
        const storedSkipped = sessionStorage.getItem("skippedSongs");
        if (storedSkipped) {
            try {
                skippedSongs = JSON.parse(storedSkipped);
                sessionStorage.removeItem("skippedSongs");
            } catch {
                skippedSongs = [];
            }
        }

        setSummaryData({
            playlistName,
            playlistUrl,
            added,
            skipped,
            skippedSongs,
        });
    }, [searchParams]);

    // Calculate success rate safely (avoid NaN)
    const total = summaryData ? summaryData.added + summaryData.skipped : 0;
    const successRate = total > 0
        ? Math.round((summaryData!.added / total) * 100)
        : 0;

    const copySkippedList = () => {
        if (!summaryData?.skippedSongs.length) return;

        const text = summaryData.skippedSongs
            .map((song) => `${song.title}${song.artist ? ` - ${song.artist}` : ""} (${song.reason})`)
            .join("\n");

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!summaryData) {
        return (
            <div className="bg-nord-bg min-h-screen flex items-center justify-center">
                <div className="text-nord-subtext flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin" style={{ animationDuration: "3s" }}>sync</span>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-nord-bg text-nord-text font-display antialiased min-h-screen flex flex-col">
            <Header showLogout />

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-lg">
                    {/* Result Card */}
                    <div className="bg-nord-surface rounded-2xl shadow-xl border border-nord-surface-highlight overflow-hidden">
                        {/* Hero Section: Success */}
                        <div className="p-8 pb-6 flex flex-col items-center text-center">
                            <div className="size-16 rounded-full bg-nord-green/10 flex items-center justify-center mb-5 text-nord-green shadow-inner ring-1 ring-nord-green/20">
                                <span
                                    className="material-symbols-outlined text-4xl"
                                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                                >
                                    check
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-nord-text mb-2">Transfer Complete</h1>
                            <p className="text-nord-subtext text-sm leading-relaxed max-w-[320px]">
                                Your playlist <span className="text-nord-frost2 font-semibold">&quot;{summaryData.playlistName}&quot;</span> has been successfully migrated to Spotify.
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="px-8 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Stat 1: Added */}
                                <div className="bg-nord-bg/50 border border-nord-surface-highlight rounded-xl p-5 flex flex-col items-start gap-1 group transition-colors hover:border-nord-green/50">
                                    <span className="text-xs font-semibold text-nord-subtext uppercase tracking-wider opacity-70">Transferred</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-nord-text">{summaryData.added}</span>
                                        <span className="text-sm font-medium text-nord-green flex items-center">
                                            <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span>
                                            {successRate}%
                                        </span>
                                    </div>
                                </div>

                                {/* Stat 2: Skipped */}
                                <div className="bg-nord-bg/50 border border-nord-surface-highlight rounded-xl p-5 flex flex-col items-start gap-1 group transition-colors hover:border-nord-red/50">
                                    <span className="text-xs font-semibold text-nord-subtext uppercase tracking-wider opacity-70">Skipped</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-nord-text">{summaryData.skipped}</span>
                                        {summaryData.skipped > 0 && (
                                            <span className="text-sm font-medium text-nord-red flex items-center">
                                                <span className="material-symbols-outlined text-sm mr-0.5">error</span>
                                                Action
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Accordion: Skipped Songs */}
                        {summaryData.skipped > 0 && (
                            <div className="px-8 py-4">
                                <details className="group bg-nord-surface-highlight/30 rounded-lg border border-transparent open:border-nord-surface-highlight transition-all duration-300">
                                    <summary className="flex cursor-pointer items-center justify-between p-3 select-none text-nord-subtext hover:text-nord-text transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-nord-red text-xl">warning</span>
                                            <span className="text-sm font-medium">View {summaryData.skipped} skipped songs</span>
                                        </div>
                                        <span className="material-symbols-outlined text-nord-subtext transition-transform duration-300 group-open:rotate-180 text-xl">expand_more</span>
                                    </summary>
                                    <div className="px-3 pb-3 pt-0">
                                        <div className="h-px w-full bg-nord-surface-highlight mb-3"></div>
                                        {summaryData.skippedSongs.length > 0 ? (
                                            <>
                                                <ul className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                                                    {summaryData.skippedSongs.map((song, index) => (
                                                        <li key={index} className="flex items-center justify-between text-sm bg-nord-bg/50 p-2 rounded border border-nord-surface-highlight/50">
                                                            <div className="flex flex-col truncate pr-2">
                                                                <span className="text-nord-text font-medium truncate">{song.title}</span>
                                                                {song.artist && (
                                                                    <span className="text-xs text-nord-subtext/60 truncate">{song.artist}</span>
                                                                )}
                                                            </div>
                                                            <span className="shrink-0 text-[10px] font-bold bg-nord-surface-highlight text-nord-subtext px-1.5 py-0.5 rounded uppercase">
                                                                {song.reason}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        onClick={copySkippedList}
                                                        className="text-xs text-nord-frost2 hover:text-nord-frost3 font-medium flex items-center gap-1 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">
                                                            {copied ? "check" : "content_copy"}
                                                        </span>
                                                        {copied ? "Copied!" : "Copy List"}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-nord-subtext/70 text-center py-2">
                                                {summaryData.skipped} songs could not be found on Spotify.
                                            </p>
                                        )}
                                    </div>
                                </details>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="p-8 pt-4 flex flex-col gap-3">
                            <a
                                href={summaryData.playlistUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 h-12 bg-nord-frost2 hover:bg-nord-frost3 text-nord-bg rounded-lg font-bold text-base transition-all transform active:scale-[0.98] shadow-lg shadow-nord-frost2/10"
                            >
                                <span className="material-symbols-outlined text-2xl">open_in_new</span>
                                Open in Spotify
                            </a>
                            <button
                                onClick={() => router.push("/")}
                                className="w-full flex items-center justify-center gap-2 h-10 bg-transparent hover:bg-nord-surface-highlight text-nord-subtext hover:text-nord-text rounded-lg font-semibold text-sm transition-colors border border-transparent hover:border-nord-muted"
                            >
                                <span className="material-symbols-outlined text-lg">add</span>
                                Start New Transfer
                            </button>
                        </div>
                    </div>

                    {/* Footer / Disclaimer */}
                    <p className="text-center text-nord-muted text-xs mt-6">
                        YouTube Music and Spotify are trademarks of their respective owners.<br />
                        TransferIt is not affiliated with either platform.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function SummaryPage() {
    return (
        <Suspense fallback={
            <div className="bg-nord-bg min-h-screen flex items-center justify-center">
                <div className="text-nord-subtext flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin" style={{ animationDuration: "3s" }}>sync</span>
                    Loading...
                </div>
            </div>
        }>
            <SummaryContent />
        </Suspense>
    );
}
