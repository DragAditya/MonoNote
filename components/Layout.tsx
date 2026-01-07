import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config';

interface LayoutProps {
  children: React.ReactNode;
  showHomeLink?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showHomeLink = true }) => {
  return (
    <div className="min-h-screen bg-white text-ink font-mono selection:bg-gray-200">
      <header className="border-b border-line px-4 py-3 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
            {showHomeLink ? (
                <Link to="/" className="font-bold tracking-tight text-lg hover:text-pencil transition-colors">
                {APP_CONFIG.APP_NAME}
                </Link>
            ) : (
                <span className="font-bold tracking-tight text-lg">{APP_CONFIG.APP_NAME}</span>
            )}
        </div>
        <nav className="text-xs text-pencil flex gap-4">
             <Link to="/" className="hover:text-ink">New</Link>
             <Link to="/about" className="hover:text-ink">About</Link>
        </nav>
      </header>
      
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className="mt-12 py-8 text-center text-xs text-pencil border-t border-line mx-4">
        <p>{APP_CONFIG.APP_NAME} &copy; {new Date().getFullYear()} &mdash; {APP_CONFIG.APP_TAGLINE}</p>
      </footer>
    </div>
  );
};