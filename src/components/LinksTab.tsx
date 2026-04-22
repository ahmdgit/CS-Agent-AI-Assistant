import React, { useState, useMemo, useEffect } from 'react';
import { LinkItem } from '../types';
import { Search, Trash2, Copy, Edit2, Check, X, Plus, ExternalLink, Link2, Star } from 'lucide-react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function LinksTab() {
  const { links, addLink, editLink, deleteLink, toggleFavoriteLink } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const filteredLinks = useMemo(() => {
    let result = links.filter(
      (l) =>
        l.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    result.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });
    
    return result;
  }, [links, searchQuery]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = (link: LinkItem) => {
    setEditingId(link.id);
    setEditUrl(link.url);
    setEditDescription(link.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditUrl('');
    setEditDescription('');
  };

  const saveEdit = (id: string) => {
    if (editUrl.trim() && editDescription.trim()) {
      editLink(id, editUrl, editDescription);
      setEditingId(null);
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewUrl('');
    setNewDescription('');
    setEditingId(null);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewUrl('');
    setNewDescription('');
  };

  const saveNewLink = () => {
    if (newUrl.trim() && newDescription.trim()) {
      addLink(newUrl, newDescription);
      setIsCreating(false);
      setNewUrl('');
      setNewDescription('');
    }
  };



  useEffect(() => {
    const onReset = () => {
      setSearchQuery('');
      setEditUrl('');
      setEditDescription('');
      setNewUrl('');
      setNewDescription('');
    };
    const onCancel = () => {
      setEditingId(null);
      setIsCreating(false);
      onReset();
    };
    window.addEventListener('reset-links', onReset);
    window.addEventListener('cancel-links', onCancel);
    return () => {
      window.removeEventListener('reset-links', onReset);
      window.removeEventListener('cancel-links', onCancel);
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Important Links</h2>
          <Button
            onClick={startCreating}
            disabled={isCreating}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Add Link
          </Button>
        </div>
        <div className="relative">
          <Input
            leftIcon={<Search className="w-5 h-5" />}
            placeholder="Search links by URL or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-indigo-200 rounded-xl overflow-hidden shadow-sm ring-1 ring-indigo-500/20"
            >
              <div className="p-4 bg-indigo-50/50 border-b border-indigo-100">
              <Input
                placeholder="Description (e.g., Internal Knowledge Base)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                autoFocus
                className="bg-white"
              />
            </div>
            <div className="p-4 bg-white">
              <Input
                type="url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="font-mono"
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={cancelCreating}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNewLink}
                  disabled={!newUrl.trim() || !newDescription.trim()}
                  leftIcon={<Check className="w-4 h-4" />}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Link
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {filteredLinks.length === 0 && !isCreating ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <Link2 className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
              {links.length === 0 ? 'No links yet' : 'No matching links'}
            </h3>
            <p className="text-slate-500 max-w-sm mb-6">
              {links.length === 0
                ? 'Add quick access links to important tools, documents, or external resources.'
                : 'Try adjusting your search to find what you are looking for.'}
            </p>
            {links.length === 0 && (
              <Button
                onClick={startCreating}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-sm mt-6"
              >
                Add Link
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredLinks.map((link) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={link.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-300 p-4"
              >
                {editingId === link.id ? (
                <div className="space-y-3">
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                  />
                  <Input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="font-mono"
                    placeholder="URL"
                  />
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditing}
                      leftIcon={<X className="w-4 h-4" />}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveEdit(link.id)}
                      disabled={!editUrl.trim() || !editDescription.trim()}
                      leftIcon={<Check className="w-4 h-4" />}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavoriteLink(link.id, !!link.isFavorite); }}
                      className="mt-1 p-1 rounded-full hover:bg-slate-200 transition-colors shrink-0"
                    >
                      <Star className={`w-5 h-5 ${link.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 truncate" title={link.description} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(link.description) }} />
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={DOMPurify.sanitize(link.url.startsWith('http') ? link.url : `https://${link.url}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline truncate font-mono flex items-center gap-1"
                          title={link.url}
                        >
                          {DOMPurify.sanitize(link.url)}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(link.id, link.url)}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      title="Copy URL"
                      leftIcon={copiedId === link.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    >
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(link)}
                      className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      title="Edit"
                      leftIcon={<Edit2 className="w-4 h-4" />}
                    >
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLink(link.id)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>
    </div>
  );
}
