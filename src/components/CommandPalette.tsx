import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Link as LinkIcon, LayoutTemplate, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { macros, links, templates } = useAppContext();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filteredMacros = macros.filter(m => 
    m.summary.toLowerCase().includes(query.toLowerCase()) || 
    m.response.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredLinks = links.filter(l => 
    l.description.toLowerCase().includes(query.toLowerCase()) || 
    l.url.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const handleCopyMacro = (response: string) => {
    navigator.clipboard.writeText(response);
    toast.success('Macro copied to clipboard!');
    setIsOpen(false);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    setIsOpen(false);
  };

  const handleCopyTemplate = (template: any) => {
    const text = template.fields.map((f: any) => `${f.label}: `).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Template copied to clipboard!');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center px-4 py-3 border-b border-slate-100 relative">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-lg pr-8"
                placeholder="Search macros, links, and templates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-2">
              {query.trim() === '' ? (
                <div className="p-8 text-center text-slate-500">
                  <p>Type to search across all your saved items.</p>
                  <p className="text-xs mt-2 text-slate-400">Press Esc to close</p>
                </div>
              ) : (
                <>
                  {filteredMacros.length === 0 && filteredLinks.length === 0 && filteredTemplates.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      No results found for "{query}"
                    </div>
                  )}

                  {filteredMacros.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Macros
                      </div>
                      {filteredMacros.map(macro => (
                        <button
                          key={macro.id}
                          onClick={() => handleCopyMacro(macro.response)}
                          className="w-full text-left px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-indigo-50 group transition-colors"
                        >
                          <FileText className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                          <div className="flex-1 truncate">
                            <div className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 truncate">
                              {macro.summary}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {macro.response}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredLinks.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Links
                      </div>
                      {filteredLinks.map(link => (
                        <button
                          key={link.id}
                          onClick={() => handleCopyLink(link.url)}
                          className="w-full text-left px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-emerald-50 group transition-colors"
                        >
                          <LinkIcon className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600" />
                          <div className="flex-1 truncate">
                            <div className="text-sm font-medium text-slate-700 group-hover:text-emerald-700 truncate">
                              {link.description}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {link.url}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredTemplates.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Templates
                      </div>
                      {filteredTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleCopyTemplate(template)}
                          className="w-full text-left px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-amber-50 group transition-colors"
                        >
                          <LayoutTemplate className="w-4 h-4 text-amber-400 group-hover:text-amber-600" />
                          <div className="flex-1 truncate">
                            <div className="text-sm font-medium text-slate-700 group-hover:text-amber-700 truncate">
                              {template.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {template.fields.length} fields
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px]">↑</kbd> <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px]">↓</kbd> to navigate</span>
                <span><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to copy</span>
              </div>
              <div>
                <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
