import { Notebook, Snippet, CreateNotebookResponse } from '../types';
import { APP_CONFIG } from '../config';
import lzString from 'lz-string';

// --- HELPERS ---

const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const isValidSlug = (slug: string): boolean => {
  const regex = /^[a-z0-9-]+$/;
  return regex.test(slug) && !APP_CONFIG.RESERVED_SLUGS.includes(slug) && slug.length >= 3 && slug.length <= 50;
};

// --- LOCAL STORAGE ---

export const saveNotebook = (notebook: Notebook): boolean => {
  try {
    localStorage.setItem(`${APP_CONFIG.STORAGE_KEY_PREFIX}${notebook.slug}`, JSON.stringify(notebook));
    return true;
  } catch (e) {
    console.error("Storage quota exceeded or error", e);
    return false;
  }
};

export const getNotebook = (slug: string): Notebook | null => {
  const data = localStorage.getItem(`${APP_CONFIG.STORAGE_KEY_PREFIX}${slug}`);
  if (!data) return null;
  try {
    const notebook = JSON.parse(data) as Notebook;
    return notebook;
  } catch {
    return null;
  }
};

export const incrementViewCount = (slug: string): void => {
  const notebook = getNotebook(slug);
  if (notebook) {
    notebook.views += 1;
    notebook.lastAccessed = Date.now();
    saveNotebook(notebook);
  }
};

export const slugExists = (slug: string): boolean => {
  return !!localStorage.getItem(`${APP_CONFIG.STORAGE_KEY_PREFIX}${slug}`);
};

export const createNotebook = (slug: string, initialSnippets: Snippet[]): CreateNotebookResponse => {
  const cleanSlug = slug.toLowerCase().trim();

  if (!isValidSlug(cleanSlug)) {
    return { success: false, error: 'Invalid URL slug. Use a-z, 0-9, and dashes only.' };
  }

  if (slugExists(cleanSlug)) {
    return { success: false, error: 'This URL is already taken.' };
  }

  const editToken = generateToken();
  const newNotebook: Notebook = {
    slug: cleanSlug,
    editToken,
    createdAt: Date.now(),
    snippets: initialSnippets,
    views: 0,
    lastAccessed: Date.now(),
  };

  const saved = saveNotebook(newNotebook);
  if (!saved) {
      return { success: false, error: 'Browser storage full. Clear some space.' };
  }
  
  return { success: true, slug: cleanSlug, editToken };
};

export const updateNotebook = (slug: string, snippets: Snippet[], token: string): boolean => {
  const notebook = getNotebook(slug);
  if (!notebook) return false;
  if (notebook.editToken !== token) return false;

  notebook.snippets = snippets;
  notebook.lastAccessed = Date.now();
  return saveNotebook(notebook);
};

// --- URL COMPRESSION (SHARING) ---

// Compresses snippets into a URL-safe string
export const compressSnippets = (snippets: Snippet[]): string => {
    // We only need title, language, code
    const minimalData = snippets.map(s => ({
        t: s.title,
        l: s.language,
        c: s.code
    }));
    const json = JSON.stringify(minimalData);
    return lzString.compressToEncodedURIComponent(json);
};

// Decompresses URL string back to a Notebook object (Read Only)
export const decompressToNotebook = (compressedData: string): Notebook | null => {
    try {
        const json = lzString.decompressFromEncodedURIComponent(compressedData);
        if (!json) return null;
        
        const data = JSON.parse(json);
        if (!Array.isArray(data)) return null;

        const snippets: Snippet[] = data.map((item: any, index: number) => ({
            id: `shared-${index}`,
            title: item.t || '',
            language: item.l || 'text',
            code: item.c || ''
        }));

        return {
            slug: 'shared',
            editToken: '',
            createdAt: Date.now(),
            views: 1,
            lastAccessed: Date.now(),
            snippets: snippets
        };
    } catch (e) {
        console.error("Failed to decompress notebook", e);
        return null;
    }
};

// --- ADMIN ---

export const adminLogin = (password: string): boolean => {
  return password === APP_CONFIG.ADMIN_PASSWORD_HASH;
};

export const getAllNotebooks = (): Notebook[] => {
  const notebooks: Notebook[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(APP_CONFIG.STORAGE_KEY_PREFIX)) {
      try {
        const item = localStorage.getItem(key);
        if (item) notebooks.push(JSON.parse(item));
      } catch (e) {
        // ignore corrupted data
      }
    }
  }
  return notebooks.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteNotebook = (slug: string): void => {
  localStorage.removeItem(`${APP_CONFIG.STORAGE_KEY_PREFIX}${slug}`);
};