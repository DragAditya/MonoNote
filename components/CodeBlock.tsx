import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Snippet } from '../types';

interface CodeBlockProps {
  snippet: Snippet;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ snippet }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(snippet.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [snippet.code]);

  // Apply syntax highlighting
  useEffect(() => {
    if (codeRef.current && (window as any).hljs) {
      // We need to remove the attribute to let hljs re-process if content changes
      codeRef.current.removeAttribute('data-highlighted');
      (window as any).hljs.highlightElement(codeRef.current);
    }
  }, [snippet.code, snippet.language]);

  return (
    <div className="mb-8 group">
      {(snippet.title || snippet.language !== 'text') && (
        <div className="flex items-baseline justify-between mb-2 text-xs text-pencil uppercase tracking-wider">
          <span className="font-bold text-ink">{snippet.title || 'Untitled Snippet'}</span>
          <span>{snippet.language}</span>
        </div>
      )}
      
      <div className="relative border border-line rounded-sm hover:border-pencil transition-colors duration-200 bg-gray-50/30">
        
        {/* Improved Copy Button - Always visible on mobile, hover on desktop */}
        <div className="absolute top-0 right-0 z-10">
            <button
                onClick={handleCopy}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b border-l border-line bg-white/90 backdrop-blur-sm
                    transition-all duration-200 
                    ${copied ? 'text-green-600 bg-green-50' : 'text-pencil hover:text-ink hover:bg-white'}
                `}
                aria-label="Copy code"
            >
                {copied ? (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Copied</span>
                    </>
                ) : (
                    <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        <span>Copy</span>
                    </>
                )}
            </button>
        </div>
        
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed tab-4">
          <code ref={codeRef} className={`language-${snippet.language}`}>
            {snippet.code}
          </code>
        </pre>
      </div>
    </div>
  );
};