import React, { useState } from 'react';
import { checkGrammar } from '../services/geminiService';
import { GrammarCheckResult } from '../types';
import { Copy, CheckCircle2, RotateCcw, SpellCheck, Check, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

export function GrammarCheckTab() {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'English' | 'Arabic'>('English');
  const [tone, setTone] = useState<'Neutral' | 'Professional' | 'Empathetic' | 'Concise'>('Neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GrammarCheckResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [editedText, setEditedText] = useState('');

  const handleCheck = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    setIsCopied(false);
    try {
      const checkResult = await checkGrammar(input, language, tone);
      setResult(checkResult);
      setEditedText(checkResult.correctedText);
    } catch (error) {
      console.error('Error checking grammar:', error);
      toast.error('Failed to check grammar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (editedText.trim()) {
      navigator.clipboard.writeText(editedText);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    setEditedText('');
    setIsCopied(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <SpellCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Grammar & Punctuation Check</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Paste your text below to check for grammar, spelling, and punctuation errors. The AI will provide a corrected version and explain the changes.
        </p>
        <div className="relative">
          <Textarea
            className="h-32 resize-none pr-10"
            placeholder="Paste text here to check..."
            value={input}
            maxLength={5000}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          {input && (
            <button
              onClick={() => setInput('')}
              className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className={`absolute bottom-3 right-3 text-xs ${input.length >= 4900 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            {input.length}/5000
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
              <span className="text-sm font-medium text-slate-700">Tone:</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="bg-slate-100 border-none text-sm font-medium text-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Neutral">Neutral (Fix only)</option>
                <option value="Professional">Professional</option>
                <option value="Empathetic">Empathetic</option>
                <option value="Concise">Concise (Shorter)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={isLoading || (!input && !result)}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset
            </Button>
            <Button
              onClick={handleCheck}
              disabled={isLoading || !input.trim()}
              isLoading={isLoading}
              leftIcon={!isLoading && <Check className="w-5 h-5" />}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Checking...' : 'Check Grammar'}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="grammar-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Corrected Text</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!editedText.trim()}
                className="bg-white shadow-sm"
                leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className={`h-40 resize-none bg-slate-50 ${language === 'Arabic' ? 'text-right' : 'text-left'}`}
                dir={language === 'Arabic' ? 'rtl' : 'ltr'}
              />
            </div>

            {result.changes.length > 0 ? (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500" />
                  Changes Made
                </h4>
                <div className="grid gap-3">
                  <AnimatePresence mode="popLayout">
                    {result.changes.map((change, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Original</span>
                            <p className="text-slate-600 line-through mt-0.5">{change.original}</p>
                          </div>
                          <div className="hidden sm:block text-slate-300">→</div>
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Corrected</span>
                            <p className="text-slate-800 font-medium mt-0.5">{change.corrected}</p>
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs mt-2 pt-2 border-t border-slate-200">
                          <span className="font-medium text-slate-600">Reason:</span> {change.explanation}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Your text looks great! No grammar or punctuation issues were found.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
