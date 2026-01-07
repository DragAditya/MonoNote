import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { NotebookView } from './pages/NotebookView';
import { NotebookEdit } from './pages/NotebookEdit';
import { Admin } from './pages/Admin';
import { APP_CONFIG } from './config';

const App: React.FC = () => {
  // Dynamically set the document title based on config
  useEffect(() => {
    document.title = APP_CONFIG.APP_NAME;
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        
        {/* Notebook Routes */}
        <Route path="/n/:slug" element={<NotebookView />} />
        <Route path="/n/:slug/edit" element={<NotebookEdit />} />
        
        {/* Shared Route (Stateless) */}
        <Route path="/s/:data" element={<NotebookView />} />
        
        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;