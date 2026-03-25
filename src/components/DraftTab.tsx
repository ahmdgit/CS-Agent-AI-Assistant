import React, { useState } from 'react';
import { generateDraft } from '../services/geminiService';
import { DraftResult } from '../types';
import { Save, Copy, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Input } from './ui/Input';

export function DraftTab() {
  const { saveMacro } = useAppContext();
  const [summaryInput, setSummaryInput] = useState('');
  const [draftInput, setDraftInput] = useState('');
  const [tone, setTone] = useState<'Professional' | 'Empathy Professional'>('Professional');
  const [language, setLanguage] = useState<'English' | 'Arabic'>('English');
  const [replyTo, setReplyTo] = useState<'Customer' | 'Driver' | 'Both'>('Customer');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);
  const [replyTarget, setReplyTarget] = useState<'user' | 'driver'>('user');
  const [summaryToSave, setSummaryToSave] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!summaryInput.trim() && !draftInput.trim()) return;
    setIsLoading(true);
    setResult(null);
    setIsSaved(false);
    setIsCopied(false);
    try {
      const draft = await generateDraft(summaryInput, draftInput, tone, language, replyTo);
      setResult(draft);
      setSelectedResponseIndex(0);
      setReplyTarget(replyTo === 'Driver' ? 'driver' : 'user');
      setSummaryToSave(draft.summary);
    } catch (error) {
      console.error('Error generating draft:', error);
      toast.error('Failed to generate draft. Please try again.');
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Full Conversation (User & Driver)</h2>
            <div className="relative">
              <Textarea
                className="h-24 resize-none"
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
                className="h-24 resize-none"
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
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
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
    </div>
  );
}
