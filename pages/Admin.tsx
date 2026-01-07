import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { adminLogin, getAllNotebooks, deleteNotebook } from '../services/storage';
import { Notebook } from '../types';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(password)) {
      setIsAuthenticated(true);
      loadData();
    } else {
      alert("Invalid password");
      setPassword('');
    }
  };

  const loadData = () => {
    setNotebooks(getAllNotebooks());
  };

  const handleDelete = (slug: string) => {
    if (confirm(`Delete /${slug} permanently?`)) {
      deleteNotebook(slug);
      loadData();
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout showHomeLink={true}>
        <div className="max-w-md mx-auto mt-20 p-8 border border-line">
          <h1 className="text-xl font-bold mb-4">Admin Access</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full border border-line p-2 mb-4 focus:border-ink outline-none"
              autoFocus
            />
            <button type="submit" className="w-full bg-ink text-white py-2 hover:bg-gray-800">
              Unlock
            </button>
          </form>
          <div className="mt-4 text-xs text-pencil text-center">
            (Hint for demo: admin123)
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHomeLink={true}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">System Overview</h1>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm underline">Logout</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-gray-50 border border-line">
            <div className="text-xs text-pencil uppercase">Total Notebooks</div>
            <div className="text-2xl font-bold">{notebooks.length}</div>
        </div>
        <div className="p-4 bg-gray-50 border border-line">
            <div className="text-xs text-pencil uppercase">Total Views</div>
            <div className="text-2xl font-bold">
                {notebooks.reduce((acc, curr) => acc + curr.views, 0)}
            </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border border-line">
          <thead className="bg-gray-50 text-pencil uppercase text-xs">
            <tr>
              <th className="p-3 border-b border-line">Slug</th>
              <th className="p-3 border-b border-line">Snippets</th>
              <th className="p-3 border-b border-line">Created</th>
              <th className="p-3 border-b border-line">Views</th>
              <th className="p-3 border-b border-line">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notebooks.map((nb) => (
              <tr key={nb.slug} className="hover:bg-gray-50 border-b border-line last:border-0">
                <td className="p-3 font-mono">
                    <a href={`#/n/${nb.slug}`} target="_blank" rel="noreferrer" className="hover:underline text-ink">
                        /{nb.slug}
                    </a>
                </td>
                <td className="p-3">{nb.snippets.length}</td>
                <td className="p-3 text-pencil">{new Date(nb.createdAt).toLocaleDateString()}</td>
                <td className="p-3">{nb.views}</td>
                <td className="p-3">
                  <button 
                    onClick={() => handleDelete(nb.slug)}
                    className="text-red-600 hover:text-red-800 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};