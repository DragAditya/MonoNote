import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getNotebook, updateNotebook } from '../services/storage';
import { Notebook, Snippet, Language } from '../types';
import { CodeEditor } from '../components/CodeEditor';
import { APP_CONFIG } from '../config';

export const NotebookEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (slug) {
      const data = getNotebook(slug);
      // Use configured token prefix
      const storedToken = localStorage.getItem(`${APP_CONFIG.TOKEN_KEY_PREFIX}${slug}`);
      
      if (!data) {
        navigate('/404');
        return;
      }

      if (storedToken !== data.editToken) {
        setError("You do not have permission to edit this notebook.");
        setLoading(false);
        return;
      }

      setNotebook(data);
      setSnippets(data.snippets);
      setToken(storedToken);
      setLoading(false);
    }
  }, [slug, navigate]);

  const addSnippet = () => {
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      title: '',
      language: 'text',
      code: '',
    };
    setSnippets([...snippets, newSnippet]);
  };

  const removeSnippet = (id: string) => {
    if (confirm('Are you sure you want to delete this snippet?')) {
        setSnippets(snippets.filter(s => s.id !== id));
    }
  };

  const updateSnippet = (id: string, field: keyof Snippet, value: string) => {
    setSnippets(snippets.map(s => s.id === id ? { ...s, [field]: value } : s));
    setSaveStatus('idle');
  };

  const handleSave = useCallback(() => {
    if (slug && token) {
      setSaveStatus('saving');
      setTimeout(() => {
          const success = updateNotebook(slug, snippets, token);
          if (success) {
            setSaveStatus('saved');
            // Reset to idle after 2 seconds
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('error');
            alert("Failed to save. Auth error?");
          }
      }, 500);
    }
  }, [slug, snippets, token]);

  // Keyboard shortcut for save
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault();
              handleSave();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (loading) return <Layout><div className="pt-20 text-center text-pencil">Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-600 pt-20 text-center">{error}</div></Layout>;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-line sticky top-16 bg-white z-10 pt-2">
        <div>
            <h1 className="text-xl font-bold">Editing: /{notebook?.slug}</h1>
            <p className="text-xs text-pencil">Ctrl+S to save</p>
        </div>
        <div className="flex gap-4 items-center">
            {saveStatus === 'saved' && <span className="text-green-600 text-sm font-medium animate-pulse">Saved!</span>}
            {saveStatus === 'saving' && <span className="text-pencil text-sm">Saving...</span>}
            
            <button
                onClick={() => navigate(`/n/${slug}`)}
                className="text-pencil hover:text-ink text-sm"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="bg-ink text-white px-6 py-2 font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
            >
                Save Changes
            </button>
        </div>
      </div>

      <div className="space-y-12 pb-20">
        {snippets.map((snippet, index) => (
          <div key={snippet.id} className="relative p-1 rounded-sm">
             <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
                 <div className="flex gap-4 w-full mr-4">
                     <input
                        type="text"
                        placeholder="Snippet Title"
                        value={snippet.title}
                        onChange={(e) => updateSnippet(snippet.id, 'title', e.target.value)}
                        className="bg-white border-b border-line px-2 py-1 text-sm w-1/2 focus:border-ink outline-none transition-colors"
                     />
                     <select
                        value={snippet.language}
                        onChange={(e) => updateSnippet(snippet.id, 'language', e.target.value as Language)}
                        className="bg-white border-b border-line px-2 py-1 text-sm w-1/3 focus:border-ink outline-none transition-colors cursor-pointer"
                     >
                         {APP_CONFIG.SUPPORTED_LANGUAGES.map(lang => (
                             <option key={lang.value} value={lang.value}>{lang.label}</option>
                         ))}
                     </select>
                 </div>
                 <button 
                    onClick={() => removeSnippet(snippet.id)}
                    className="text-red-500 hover:text-red-700 text-xs uppercase font-bold self-start sm:self-center"
                 >
                     Delete
                 </button>
             </div>
             
             <div className="h-96 shadow-sm border border-line rounded-sm overflow-hidden">
                <CodeEditor
                    value={snippet.code}
                    onChange={(val) => updateSnippet(snippet.id, 'code', val)}
                    language={snippet.language}
                    onLanguageChange={(lang) => updateSnippet(snippet.id, 'language', lang)}
                    placeholder="// Code goes here..."
                    className="w-full h-full border-0"
                />
             </div>

             <div className="absolute -left-6 top-10 text-gray-200 font-bold select-none text-4xl -z-10 hidden xl:block">
                 {index + 1}
             </div>
          </div>
        ))}

        <button
            onClick={addSnippet}
            className="w-full py-4 border-2 border-dashed border-line text-pencil hover:border-pencil hover:text-ink transition-all font-bold uppercase tracking-wide text-sm bg-gray-50 hover:bg-white"
        >
            + Add Another Snippet
        </button>
      </div>
    </Layout>
  );
};