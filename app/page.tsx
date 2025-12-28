"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { extractPlaylistId } from "@/lib/youtube";
import spotify from "@/public/spotify.png";

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
      {/* Navbar */}
      <header className="w-full border-b border-nord-surface-highlight/30 bg-nord-bg/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-nord-surface-highlight flex items-center justify-center text-nord-bg">
              <span className="material-symbols-outlined text-[20px]">sync_alt</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">TransferIt</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-nord-subtext">
            <a className="hover:text-primary transition-colors" href="#">How it works</a>
            <a className="hover:text-primary transition-colors" href="#">Pricing</a>
            <a className="hover:text-primary transition-colors" href="#">FAQ</a>
          </nav>
          <button className="hidden md:flex text-sm font-semibold text-nord-text hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-nord-surface">
            Login
          </button>
          <button className="md:hidden text-nord-text p-2">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nord-surface border border-nord-surface-highlight/50 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-medium text-nord-subtext uppercase tracking-wide">V 2.0 Now Live</span>
            </div>
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
                <span className="material-symbols-outlined group-hover:animate-bounce"><Image src={spotify} alt="Spotify" width={24} height={24} /></span>
                <span>Connect to Spotify</span>
                <span className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-nord-bg/70">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </span>
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
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-nord-surface-highlight/30 py-8 bg-nord-bg">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-nord-muted">© 2024 TransferIt. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="text-sm text-nord-muted hover:text-nord-subtext transition-colors" href="#">Privacy Policy</a>
            <a className="text-sm text-nord-muted hover:text-nord-subtext transition-colors" href="#">Terms of Service</a>
            <a className="text-sm text-nord-muted hover:text-nord-subtext transition-colors flex items-center gap-1" href="#">
              <span className="material-symbols-outlined text-[16px]">code</span>
              API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
