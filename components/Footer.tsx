export default function Footer() {
    return (
        <footer className="w-full border-t border-nord-surface-highlight/30 py-8 bg-nord-bg">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-nord-muted">© 2026 TransferIt. All rights reserved.</p>
                <div className="flex items-center gap-6">
                    <a
                        className="text-sm text-nord-muted hover:text-nord-subtext transition-colors"
                        href="#"
                    >
                        Privacy Policy
                    </a>
                    
                </div>
            </div>
        </footer>
    );
}
