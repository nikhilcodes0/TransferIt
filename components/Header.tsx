"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
    showLogout?: boolean;
}

export default function Header({ showLogout = false }: HeaderProps) {
    const router = useRouter();

    return (
        <header className="w-full border-b border-nord-surface/30 bg-nord-surface/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div
                    className="flex items-center gap-3 select-none cursor-pointer"
                    onClick={() => router.push("/")}
                >
                    <div className="size-8 rounded-lg bg-linear-to-br from-nord-frost2 to-nord-frost4 flex items-center justify-center text-nord-bg shadow-[0_0_15px_rgba(136,192,208,0.15)]">
                        <span className="material-symbols-outlined text-xl font-bold">graphic_eq</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">TransferIt</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-nord-bg border border-nord-surface-highlight/50 text-xs font-medium text-nord-subtext">
                        <span className="flex size-2 rounded-full bg-nord-green animate-pulse"></span>
                        System Operational
                    </div>
                    <div className="flex items-center gap-4">
                        
                        {showLogout && (
                            <>
                                <div className="h-8 w-px bg-nord-surface-highlight"></div>
                                <button
                                    onClick={() => router.push("/")}
                                    className="flex items-center gap-2 text-nord-subtext hover:text-white transition-colors text-sm font-medium"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
