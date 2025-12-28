"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { extractPlaylistId } from "@/lib/youtube";
import spotify from "@/public/spotify.png";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = () => {
    setError(null);

    if (!playlistUrl.trim()) {
      setError("Please enter a YouTube playlist URL");
      return;
    }

    const playlistId = extractPlaylistId(playlistUrl);

    if (!playlistId) {
      setError("Invalid YouTube playlist URL. Please check the URL and try again.");
      return;
    }

    // Redirect to transfer page with playlist ID
    router.push(`/transfer?playlistId=${encodeURIComponent(playlistId)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTransfer();
    }
  };

  return (
    <div className="bg-nord-bg text-nord-text font-display overflow-x-hidden min-h-screen flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="grow flex items-center justify-center relative px-4 py-12 md:py-20">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl mix-blend-screen opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-nord-surface-highlight/20 rounded-full blur-[100px] mix-blend-screen opacity-20"></div>
        </div>

        <div className="relative z-10 w-full max-w-[640px] flex flex-col items-center">
          {/* Hero Text */}
          <div className="text-center mb-10 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
              Transfer <span className="text-red-500">YouTube</span> playlists <br className="hidden md:block" /> to <span className="text-green-500">Spotify</span>
            </h2>
            <p className="text-lg text-nord-subtext/80 max-w-lg mx-auto font-medium leading-relaxed">
              Migrate your music collection in seconds. Simply paste your public playlist URL below to start the migration engine.
            </p>
          </div>

          {/* Input Card */}
          <div className="w-full bg-nord-surface border border-nord-surface-highlight/50 rounded-2xl shadow-2xl p-2 md:p-3">
            <div className="bg-nord-bg/50 rounded-xl border border-nord-surface-highlight/30 p-6 md:p-8 flex flex-col gap-6">
              {/* Input Field Group */}


              {/* Action Button */}
              <button
                className="group relative w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-nord-bg font-bold text-lg py-4 px-6 rounded-xl transition-all duration-200 shadow-glow hover:-translate-y-px active:translate-y-px"
                onClick={() => window.location.href = "/api/auth/spotify"}
              >
                <span className="material-symbols-outlined"><Image src={spotify} alt="Spotify" width={24} height={24} /></span>
                <span>Connect to Spotify</span>

              </button>
            </div>
          </div>

          {/* Features / Social Proof */}
          <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left px-4">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="p-2 bg-nord-surface rounded-lg text-primary mb-1">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h3 className="text-sm font-bold text-white">Lightning Fast</h3>
              <p className="text-xs text-nord-muted leading-relaxed">Engineered for speed, processing hundreds of tracks in seconds.</p>
            </div>
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="p-2 bg-nord-surface rounded-lg text-primary mb-1">
                <span className="material-symbols-outlined">security</span>
              </div>
              <h3 className="text-sm font-bold text-white">Secure Transfer</h3>
              <p className="text-xs text-nord-muted leading-relaxed">We never store your credentials. Transfers happen in real-time.</p>
            </div>
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="p-2 bg-nord-surface rounded-lg text-primary mb-1">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3 className="text-sm font-bold text-white">High Accuracy</h3>
              <p className="text-xs text-nord-muted leading-relaxed">Smart matching algorithm ensures you get the right song every time.</p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-16 w-full">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-lg font-bold text-white tracking-tight">How it works</h3>
              <span className="text-xs font-medium text-nord-muted uppercase tracking-widest">Workflow</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2 bg-nord-surface border border-nord-surface-highlight/50 rounded-2xl p-5 md:p-6 flex items-start gap-4 hover:border-green-400/50 transition-colors duration-300 group shadow-lg shadow-black/20">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">login</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base mb-1">1. Connect Spotify</h4>
                  <p className="text-sm text-nord-subtext/80 leading-relaxed">Securely link your Spotify account to enable the transfer.</p>
                </div>
              </div>
              <div className="bg-nord-surface border border-nord-surface-highlight/50 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 hover:border-primary/50 transition-colors duration-300 group shadow-lg shadow-black/20 h-full min-h-[160px]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">content_paste</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base mb-1">2. Paste URL</h4>
                  <p className="text-sm text-nord-subtext/80">Copy your public playlist link from YouTube or YouTube Music.</p>
                </div>
              </div>
              <div className="bg-nord-surface border border-nord-surface-highlight/50 rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-4 hover:border-primary/50 transition-colors duration-300 group shadow-lg shadow-black/20 h-full min-h-[160px]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined group-hover:animate-spin">sync</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base mb-1">3. Transfer Playlist</h4>
                  <p className="text-sm text-nord-subtext/80">We match songs automatically in the background.</p>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 bg-nord-surface border border-nord-surface-highlight/50 rounded-2xl p-5 md:p-6 flex items-center gap-4 hover:border-primary/50 transition-colors duration-300 group shadow-lg shadow-black/20">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-nord-bg border border-nord-surface-highlight flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">library_music</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base mb-1">4. View Results</h4>
                  <p className="text-sm text-nord-subtext/80 leading-relaxed">Your new playlist is ready. Open it directly in Spotify and start listening.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
