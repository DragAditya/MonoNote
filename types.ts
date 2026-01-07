export type Language = 'text' | 'java' | 'cpp' | 'python' | 'javascript' | 'typescript' | 'go' | 'rust';

export interface Snippet {
  id: string;
  title: string;
  language: Language;
  code: string;
}

export interface Notebook {
  slug: string;
  editToken: string;
  createdAt: number;
  snippets: Snippet[];
  views: number;
  lastAccessed: number;
}

export interface CreateNotebookResponse {
  success: boolean;
  slug?: string;
  editToken?: string;
  error?: string;
}