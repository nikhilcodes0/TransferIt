"use client";

import Image from "next/image";
import spotify from "@/public/spotify.png";

export default function Home() {
  return (
    <div className="bg-nord-bg text-nord-text font-display overflow-x-hidden min-h-screen flex flex-col selection:bg-primary selection:text-nord-bg">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none z-0 opacity-40"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-green/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none z-0 opacity-30"></div>

      {/* Header */}
      <header className="w-full border-b border-nord-surface-highlight/40 bg-nord-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-nord-bg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">sync_alt</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white group-hover:text-primary transition-colors">TransferIt</h1>
          </div>
          <nav className="hidden md:flex items-center gap-1 p-1 bg-nord-surface/50 rounded-full border border-nord-surface-highlight/50 backdrop-blur-sm">
            <a className="px-5 py-2 text-sm font-semibold text-nord-subtext hover:text-white hover:bg-nord-surface-highlight rounded-full transition-all" href="#workflow">How it works</a>
            <a className="px-5 py-2 text-sm font-semibold text-nord-subtext hover:text-white hover:bg-nord-surface-highlight rounded-full transition-all" href="#">FAQ</a>
          </nav>
          
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start relative px-4 py-12 md:py-24 gap-16 md:gap-24">
        {/* Hero Section */}
        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center animate-float">
          <div className="text-center mb-12 space-y-6">

            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-2xl">
              Move <span className="text-[#FF0000]" style={{ textShadow: '0 0 30px rgba(255, 0, 0, 0.5)' }}>YouTube</span> to <br className="hidden md:block" />
              <span className="text-[#1DB954]" style={{ textShadow: '0 0 30px rgba(29, 185, 84, 0.5)' }}>Spotify</span> faster.
            </h2>
            <p className="text-lg md:text-xl text-nord-subtext max-w-xl mx-auto font-medium leading-relaxed">
              The developer-friendly migration tool for your music. <br className="hidden md:block" /> No sign-up required to test. Just paste and go.
            </p>
          </div>

          {/* CTA Card */}
          <div className="w-full relative group perspective-1000">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-green rounded-[1.7rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-full bg-nord-surface/90 border border-nord-surface-highlight rounded-3xl shadow-2xl p-2 backdrop-blur-xl">
              <div className="bg-nord-bg rounded-2xl border border-nord-surface-highlight/30 p-6 md:p-8 flex flex-col gap-6">
                <button
                  className="relative w-full overflow-hidden group/btn flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary-hover text-nord-bg font-extrabold text-xl py-5 px-6 rounded-xl transition-all duration-300 shadow-glow hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                  onClick={() => window.location.href = "/api/auth/spotify"}
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 ease-in-out skew-x-12"></div>
                  <Image src={spotify} alt="Spotify" width={28} height={28} />
                  <span className="relative z-10">Connect Spotify &amp; Transfer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div id="workflow" className="w-full max-w-5xl px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h3 className="text-3xl font-bold text-white tracking-tight mb-2">Workflow</h3>
              <p className="text-nord-muted font-medium">Four simple steps to migrate your audio library.</p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-nord-surface-highlight to-transparent mx-6 my-4 md:my-0"></div>
            <span className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full border border-nord-surface-highlight text-nord-muted bg-nord-surface">
              <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
            {/* Step 1 - Connect Spotify */}
            <div className="bento-card col-span-1 md:col-span-2 row-span-1 bg-gradient-to-br from-nord-surface to-nord-surface-highlight/30 border border-nord-surface-highlight rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-9xl select-none group-hover:opacity-20 transition-opacity">1</div>
              <div className="relative z-10 flex flex-col justify-between h-full gap-6">
                <div className="w-14 h-14 rounded-2xl bg-accent-green/10 flex items-center justify-center text-accent-green border border-accent-green/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[32px]">login</span>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white mb-2">Connect Spotify</h4>
                  <p className="text-nord-subtext leading-relaxed max-w-sm">
                    Securely authenticate with your Spotify account. We only request permissions needed to create playlists on your behalf.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 - Paste URL */}
            <div className="bento-card col-span-1 bg-nord-surface border border-nord-surface-highlight rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50">
              <div className="absolute top-[-10px] right-[-10px] w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
              <div className="relative z-10 flex flex-col h-full gap-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-nord-bg flex items-center justify-center text-primary border border-nord-surface-highlight shadow-sm">
                    <span className="material-symbols-outlined">content_paste</span>
                  </div>
                  <span className="font-mono text-4xl font-bold text-nord-surface-highlight/50 group-hover:text-primary/20 transition-colors">02</span>
                </div>
                <div className="mt-auto">
                  <h4 className="text-xl font-bold text-white mb-1">Paste URL</h4>
                  <p className="text-sm text-nord-muted font-medium">Copy the public link from YouTube Music.</p>
                </div>
              </div>
            </div>

            {/* Step 3 - Transfer */}
            <div className="bento-card col-span-1 bg-nord-surface border border-nord-surface-highlight rounded-3xl p-8 relative overflow-hidden group hover:border-primary/50">
              <div className="absolute bottom-[-10px] left-[-10px] w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>
              <div className="relative z-10 flex flex-col h-full gap-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-nord-bg flex items-center justify-center text-primary border border-nord-surface-highlight shadow-sm">
                    <span className="material-symbols-outlined group-hover:animate-spin">sync</span>
                  </div>
                  <span className="font-mono text-4xl font-bold text-nord-surface-highlight/50 group-hover:text-primary/20 transition-colors">03</span>
                </div>
                <div className="mt-auto">
                  <h4 className="text-xl font-bold text-white mb-1">Transfer</h4>
                  <p className="text-sm text-nord-muted font-medium">Our engine matches songs in the background.</p>
                </div>
              </div>
            </div>

            {/* Step 4 - View Results */}
            <div className="bento-card col-span-1 md:col-span-2 bg-gradient-to-br from-nord-surface to-nord-bg border border-nord-surface-highlight rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
              <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-9xl select-none group-hover:opacity-20 transition-opacity">4</div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 h-full">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-nord-bg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[32px]">library_music</span>
                </div>
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold text-white mb-2">View Results</h4>
                  <p className="text-nord-subtext leading-relaxed">
                    Your new playlist is ready instantly. Open it directly in Spotify and start listening immediately.
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-nord-bg border border-nord-surface-highlight text-xs font-mono text-nord-muted">
                  <span className="w-2 h-2 rounded-full bg-accent-green"></span>
                  API Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-nord-surface-highlight/30 py-12 bg-nord-bg/95 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded bg-nord-subtext flex items-center justify-center text-nord-bg">
              <span className="material-symbols-outlined text-[16px]">sync_alt</span>
            </div>
            <p className="text-sm text-nord-subtext font-medium">© 2024 TransferIt</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <a className="text-sm font-medium text-nord-muted hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-sm font-medium text-nord-muted hover:text-primary transition-colors" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* CSS Styles */}
      <style jsx>{`
        .grid-bg {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(76, 86, 106, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(76, 86, 106, 0.1) 1px, transparent 1px);
        }
        .bento-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-card:hover {
          transform: translateY(-4px);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
