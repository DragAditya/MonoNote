import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { createNotebook, isValidSlug } from '../services/storage';
import { Snippet, Language } from '../types';
import { APP_CONFIG } from '../config';
import { CodeEditor } from '../components/CodeEditor';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for multiple snippets
  const [snippets, setSnippets] = useState<Snippet[]>([
    { id: '1', title: 'Main', language: 'text', code: '' }
  ]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
    setError(null);
  };

  const updateSnippet = (id: string, field: keyof Snippet, value: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSnippet = () => {
    setSnippets(prev => [
        ...prev, 
        { 
            id: Date.now().toString(), 
            title: '', 
            language: 'text', 
            code: '' 
        }
    ]);
  };

  const removeSnippet = (id: string) => {
    if (snippets.length === 1) return; // Prevent deleting the last one
    setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) {
      setError("Please choose a URL slug.");
      return;
    }
    
    const hasCode = snippets.some(s => s.code.trim().length > 0);
    if (!hasCode) {
      setError("Please enter code in at least one snippet.");
      return;
    }

    if (!isValidSlug(slug)) {
      setError("Invalid URL. Use at least 3 chars (a-z, 0-9, -).");
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
        const validSnippets = snippets.filter(s => s.code.trim().length > 0);
        const finalSnippets = validSnippets.length > 0 ? validSnippets : snippets;

        const result = createNotebook(slug, finalSnippets);
        
        if (result.success && result.slug) {
            // Use configured token prefix
            localStorage.setItem(`${APP_CONFIG.TOKEN_KEY_PREFIX}${result.slug}`, result.editToken || '');
            navigate(`/n/${result.slug}`);
        } else {
            setError(result.error || "Unknown error occurred.");
            setIsSubmitting(false);
        }
    }, 150);
  }, [slug, snippets, navigate]);

  return (
    <Layout showHomeLink={false}>
      <div className="mt-8 md:mt-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {APP_CONFIG.APP_NAME}
        </h1>
        <p className="text-pencil mb-12 text-lg">
          No login. No bloat. Just code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="space-y-3">
            <label htmlFor="slug" className="block text-sm font-bold uppercase tracking-wide text-ink/70">
              1. Claim your URL
            </label>
            <div className="flex items-center group">
              <span className="text-pencil mr-2 select-none text-xl">{APP_CONFIG.DOMAIN}/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="my-cool-project"
                className="flex-1 bg-transparent border-b-2 border-line focus:border-ink outline-none py-2 font-mono text-xl placeholder-gray-300 transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          <div className="space-y-8">
             <label className="block text-sm font-bold uppercase tracking-wide text-ink/70">
              2. Add your code
            </label>
            
            {snippets.map((snippet, index) => (
                <div key={snippet.id} className="relative animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-2 gap-2">
                        <div className="flex gap-4 w-full max-w-2xl">
                            <input 
                                type="text"
                                placeholder="Filename (e.g., main.js)"
                                value={snippet.title}
                                onChange={(e) => updateSnippet(snippet.id, 'title', e.target.value)}
                                className="border-b border-line focus:border-ink outline-none py-1 text-sm w-2/3 bg-transparent font-medium"
                            />
                            <select
                                value={snippet.language}
                                onChange={(e) => updateSnippet(snippet.id, 'language', e.target.value as Language)}
                                className="border-b border-line focus:border-ink outline-none py-1 text-sm w-1/3 bg-transparent text-pencil hover:text-ink cursor-pointer"
                            >
                                {APP_CONFIG.SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                                ))}
                            </select>
                        </div>
                        {snippets.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeSnippet(snippet.id)}
                                className="text-xs text-red-400 hover:text-red-600 uppercase font-bold self-end sm:self-auto"
                            >
                                Remove File
                            </button>
                        )}
                    </div>
                    
                    <div className="h-64 sm:h-80 shadow-sm transition-shadow hover:shadow-md">
                        <CodeEditor
                            value={snippet.code}
                            onChange={(val) => updateSnippet(snippet.id, 'code', val)}
                            language={snippet.language}
                            onLanguageChange={(lang) => updateSnippet(snippet.id, 'language', lang)}
                            placeholder="// Paste your code here..."
                            className="w-full h-full"
                        />
                    </div>
                </div>
            ))}
            
            <button
                type="button"
                onClick={addSnippet}
                className="text-sm font-bold text-pencil hover:text-ink flex items-center gap-2 transition-colors px-2 py-1 -ml-2 rounded hover:bg-gray-100"
            >
                <span className="text-lg leading-none">+</span> Add another file
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-ink text-white px-8 py-4 font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto shadow-md hover:shadow-lg transform active:scale-[0.98]"
          >
            {isSubmitting ? 'Creating Notebook...' : 'Create Notebook'}
          </button>

        </form>
      </div>
    </Layout>
  );
};