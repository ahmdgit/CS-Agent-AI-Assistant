import React, { useState, useEffect } from 'react';
import { generateDraft } from '../services/geminiService';
import { DraftResult } from '../types';
import { Save, Copy, CheckCircle2, AlertTriangle, RotateCcw, X, Plus, Trash2, Edit2, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Input } from './ui/Input';

interface ManageListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  onSave: (items: string[]) => void;
}

function ManageListModal({ isOpen, onClose, title, items, onSave }: ManageListModalProps) {
  const [localItems, setLocalItems] = useState<string[]>(items);
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setLocalItems(items);
  }, [items, isOpen]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newItem.trim() && !localItems.includes(newItem.trim())) {
      setLocalItems([...localItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleDelete = (index: number) => {
    setLocalItems(localItems.filter((_, i) => i !== index));
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newItems = [...localItems];
      newItems[editingIndex] = editValue.trim();
      setLocalItems(newItems);
      setEditingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex gap-2 mb-4">
            <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add new..." onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <Button onClick={handleAdd}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-2">
            {localItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border">
                {editingIndex === idx ? (
                  <div className="flex gap-2 flex-1 mr-2">
                    <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit()} className="h-8" />
                    <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                  </div>
                ) : (
                  <span className="font-medium text-slate-700">{item}</span>
                )}
                {editingIndex !== idx && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingIndex(idx); setEditValue(item); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(idx)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
            {localItems.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No items saved.</p>}
          </div>
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(localItems); onClose(); }}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

interface DraftHistoryItem {
  id: string;
  timestamp: number;
  summaryInput: string;
  draftInput: string;
  result: DraftResult;
  tone: string;
  language: string;
  replyTo: string;
}

const sanitizePhoneNumbers = (text: string) => {
  if (!text) return text;
  return text.replace(/\+?[\d\s()-]{8,25}/g, (match) => {
    const digitCount = match.replace(/[^\d]/g, '').length;
    if (digitCount >= 8 && digitCount <= 15) {
      return ' [PHONE REMOVED] ';
    }
    return match;
  });
};

const sanitizeDraftResult = (result: DraftResult): DraftResult => {
  return {
    sentiment: result.sentiment,
    summary: sanitizePhoneNumbers(result.summary),
    responses: result.responses.map(sanitizePhoneNumbers),
    driverResponses: result.driverResponses.map(sanitizePhoneNumbers),
  };
};

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DraftHistoryItem[];
  onSelect: (item: DraftHistoryItem) => void;
}

function HistoryModal({ isOpen, onClose, history, onSelect }: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Draft History
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto bg-slate-50/50">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No history yet. Generated drafts will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md mr-2">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mr-2">
                        {item.replyTo}
                      </span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        {item.language}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => { onSelect(item); onClose(); }}>
                      View
                    </Button>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">Summary:</h4>
                    <p className="text-sm text-slate-600 line-clamp-2">{item.result.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DraftTab() {
  const { saveMacro } = useAppContext();
  const [summaryInput, setSummaryInput] = useState('');

  const [draftInput, setDraftInput] = useState('');
  const [tone, setTone] = useState<'Professional' | 'Empathy Professional'>('Professional');
  const [language, setLanguage] = useState<'English' | 'Arabic'>('English');
  const [replyTo, setReplyTo] = useState<'Customer' | 'Driver' | 'Both'>('Customer');
  const [replyLength, setReplyLength] = useState('Auto');
  
  const [savedNames, setSavedNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedAgentNames');
    return saved ? JSON.parse(saved) : ['Ahmed'];
  });
  const [savedCompanies, setSavedCompanies] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedCompanies');
    return saved ? JSON.parse(saved) : ['Yango', 'Otaxi', 'Yandex'];
  });

  const [agentName, setAgentName] = useState(savedNames[0] || '');
  const [company, setCompany] = useState(savedCompanies[0] || 'Yango');
  const [managingList, setManagingList] = useState<'names' | 'companies' | null>(null);

  const [includeGreeting, setIncludeGreeting] = useState(true);
  const [includeEnding, setIncludeEnding] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);
  const [replyTarget, setReplyTarget] = useState<'user' | 'driver'>('user');
  const [summaryToSave, setSummaryToSave] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [history, setHistory] = useState<DraftHistoryItem[]>(() => {
    const saved = localStorage.getItem('draftHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleSaveNames = (newNames: string[]) => {
    setSavedNames(newNames);
    localStorage.setItem('savedAgentNames', JSON.stringify(newNames));
    if (newNames.length > 0 && !newNames.includes(agentName)) {
      setAgentName(newNames[0]);
    } else if (newNames.length === 0) {
      setAgentName('');
    }
  };

  const handleSaveCompanies = (newCompanies: string[]) => {
    setSavedCompanies(newCompanies);
    localStorage.setItem('savedCompanies', JSON.stringify(newCompanies));
    if (newCompanies.length > 0 && !newCompanies.includes(company)) {
      setCompany(newCompanies[0]);
    } else if (newCompanies.length === 0) {
      setCompany('');
    }
  };

  const handleGenerate = async () => {
    if (!summaryInput.trim() && !draftInput.trim()) return;
    setIsLoading(true);
    setResult(null);
    setIsSaved(false);
    setIsCopied(false);
    try {
      const draft = await generateDraft(summaryInput, draftInput, tone, language, replyTo, replyLength, agentName, company, includeGreeting, includeEnding);
      
      const sanitizedDraft = sanitizeDraftResult(draft);
      const sanitizedSummaryInput = sanitizePhoneNumbers(summaryInput);
      const sanitizedDraftInput = sanitizePhoneNumbers(draftInput);

      setResult(sanitizedDraft);
      setSelectedResponseIndex(0);
      setReplyTarget(replyTo === 'Driver' ? 'driver' : 'user');
      setSummaryToSave(sanitizedDraft.summary);

      // Save to history
      const newHistoryItem: DraftHistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        summaryInput: sanitizedSummaryInput,
        draftInput: sanitizedDraftInput,
        result: sanitizedDraft,
        tone,
        language,
        replyTo
      };

      setHistory(prev => {
        const newHistory = [newHistoryItem, ...prev].slice(0, 50); // Keep last 50
        localStorage.setItem('draftHistory', JSON.stringify(newHistory));
        return newHistory;
      });

    } catch (error: any) {
      console.error('Error generating draft:', error);
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        toast.error('API quota exceeded. Please wait a minute and try again, or add your own API key in Settings.', { duration: 6000 });
      } else {
        toast.error('Failed to generate draft. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const responsesArray = replyTarget === 'user' ? result?.responses : result?.driverResponses;
    if (result && responsesArray && responsesArray[selectedResponseIndex] && summaryToSave.trim()) {
      saveMacro(summaryToSave, responsesArray[selectedResponseIndex]);
      setIsSaved(true);
      toast.success('Saved to Macros!');
    }
  };

  const handleCopy = () => {
    const responsesArray = replyTarget === 'user' ? result?.responses : result?.driverResponses;
    if (result && responsesArray && responsesArray[selectedResponseIndex]) {
      navigator.clipboard.writeText(responsesArray[selectedResponseIndex]);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setSummaryInput('');
    setDraftInput('');
    setResult(null);
    setSummaryToSave('');
    setIsSaved(false);
    setIsCopied(false);
  };



  const handleLoadHistoryItem = (item: DraftHistoryItem) => {
    setSummaryInput(item.summaryInput);
    setDraftInput(item.draftInput);
    setTone(item.tone as any);
    setLanguage(item.language as any);
    setReplyTo(item.replyTo as any);
    setResult(item.result);
    setSelectedResponseIndex(0);
    setReplyTarget(item.replyTo === 'Driver' ? 'driver' : 'user');
    setSummaryToSave(item.result.summary);
    setIsSaved(false);
    setIsCopied(false);
  };

  useEffect(() => {
    const onReset = () => handleReset();
    const onCancel = () => handleReset();
    window.addEventListener('reset-draft', onReset);
    window.addEventListener('cancel-draft', onCancel);
    return () => {
      window.removeEventListener('reset-draft', onReset);
      window.removeEventListener('cancel-draft', onCancel);
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Full Conversation (User & Driver)</h2>
            <div className="relative">
              <Textarea
                className="min-h-[96px] h-32 resize-y"
                placeholder="Paste the full conversation history here..."
                value={summaryInput}
                maxLength={5000}
                onChange={(e) => setSummaryInput(e.target.value)}
                disabled={isLoading}
              />
              <div className={`absolute bottom-3 right-3 text-xs ${summaryInput.length >= 4900 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {summaryInput.length}/5000
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">What I need to say (Draft/Points)</h2>
            <div className="relative">
              <Textarea
                className="min-h-[96px] h-32 resize-y"
                placeholder="Paste bullet points or draft response here..."
                value={draftInput}
                maxLength={5000}
                onChange={(e) => setDraftInput(e.target.value)}
                disabled={isLoading}
              />
              <div className={`absolute bottom-3 right-3 text-xs ${draftInput.length >= 4900 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                {draftInput.length}/5000
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Reply To:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setReplyTo('Customer')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    replyTo === 'Customer'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Customer
                </button>
                <button
                  onClick={() => setReplyTo('Driver')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    replyTo === 'Driver'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Driver
                </button>
                <button
                  onClick={() => setReplyTo('Both')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    replyTo === 'Both'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Tone:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setTone('Professional')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    tone === 'Professional'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Professional
                </button>
                <button
                  onClick={() => setTone('Empathy Professional')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    tone === 'Empathy Professional'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Empathy
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Language:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setLanguage('English')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    language === 'English'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('Arabic')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    language === 'Arabic'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Arabic
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Length:</span>
              <select
                value={replyLength}
                onChange={(e) => setReplyLength(e.target.value)}
                className="h-9 px-3 py-1.5 bg-slate-100 border-none rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <option value="Auto">Auto</option>
                <option value="1">1 Sentence</option>
                <option value="2">2 Sentences</option>
                <option value="3">3 Sentences</option>
                <option value="4">4 Sentences</option>
                <option value="5">5+ Sentences</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Your Name:</span>
              <div className="flex items-center gap-1">
                <select
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="h-9 px-3 py-1.5 bg-slate-100 border-none rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-200 transition-colors w-32"
                >
                  {savedNames.map(name => <option key={name} value={name}>{name}</option>)}
                  {savedNames.length === 0 && <option value="">Select...</option>}
                </select>
                <button onClick={() => setManagingList('names')} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100" title="Manage Names">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Company:</span>
              <div className="flex items-center gap-1">
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-9 px-3 py-1.5 bg-slate-100 border-none rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-200 transition-colors w-32"
                >
                  {savedCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                  {savedCompanies.length === 0 && <option value="">Select...</option>}
                </select>
                <button onClick={() => setManagingList('companies')} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100" title="Manage Companies">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGreeting}
                  onChange={(e) => setIncludeGreeting(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                Include Greeting
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEnding}
                  onChange={(e) => setIncludeEnding(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                Include Ending
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex-1 sm:flex-none"
              leftIcon={<History className="w-4 h-4" />}
            >
              History
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={isLoading || (!summaryInput && !draftInput && !result)}
              className="flex-1 sm:flex-none"
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isLoading || (!summaryInput.trim() && !draftInput.trim())}
              isLoading={isLoading}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Thinking...' : 'Generate Answer'}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="draft-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Suggested Replies</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="text-indigo-600 hover:bg-indigo-50"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Regenerate
                </Button>
                {result.sentiment === 'Angry' && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100">
                    <AlertTriangle className="w-4 h-4" />
                    Customer seems Angry
                  </div>
                )}
                {result.sentiment !== 'Angry' && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                    Sentiment: {result.sentiment}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-200 pb-2">
              {replyTo === 'Both' ? (
                <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                  <button
                    onClick={() => {
                      setReplyTarget('user');
                      setSelectedResponseIndex(0);
                      setIsCopied(false);
                      setIsSaved(false);
                    }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      replyTarget === 'user'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Reply to User
                  </button>
                  <button
                    onClick={() => {
                      setReplyTarget('driver');
                      setSelectedResponseIndex(0);
                      setIsCopied(false);
                      setIsSaved(false);
                    }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      replyTarget === 'driver'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Reply to Driver
                  </button>
                </div>
              ) : (
                <div className="flex items-center self-start px-2 py-1.5 text-sm font-medium text-slate-700">
                  {replyTarget === 'user' ? 'Reply to Customer' : 'Reply to Driver'}
                </div>
              )}
              
              <div className="flex gap-2 sm:ml-auto">
                {(replyTarget === 'user' ? result.responses : (result.driverResponses || [])).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedResponseIndex(index);
                      setIsCopied(false);
                      setIsSaved(false);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      selectedResponseIndex === index
                        ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Option {index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${replyTarget}-${selectedResponseIndex}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  dir={language === 'Arabic' ? 'rtl' : 'ltr'}
                  className={`p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap font-sans leading-relaxed ${language === 'Arabic' ? 'text-right' : 'text-left'}`}
                >
                  {replyTarget === 'user' ? result.responses[selectedResponseIndex] : (result.driverResponses || [])[selectedResponseIndex]}
                </motion.div>
              </AnimatePresence>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="absolute top-3 right-3 bg-white shadow-sm z-10"
                leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Want to save this for later?</h4>
              <div className="flex gap-3">
                <Input
                  placeholder="Issue Summary (Title)"
                  value={summaryToSave}
                  onChange={(e) => setSummaryToSave(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSave}
                  disabled={isSaved || !summaryToSave.trim()}
                  className="bg-slate-800 hover:bg-slate-900 text-white"
                  leftIcon={isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                >
                  {isSaved ? 'Saved to Macros' : 'Save to Macros'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ManageListModal
        isOpen={managingList === 'names'}
        onClose={() => setManagingList(null)}
        title="Manage Saved Names"
        items={savedNames}
        onSave={handleSaveNames}
      />

      <ManageListModal
        isOpen={managingList === 'companies'}
        onClose={() => setManagingList(null)}
        title="Manage Saved Companies"
        items={savedCompanies}
        onSave={handleSaveCompanies}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelect={handleLoadHistoryItem}
      />
    </div>
  );
}
