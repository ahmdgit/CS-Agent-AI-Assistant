import React, { useState, useEffect } from 'react';
import { rephraseText } from '../services/geminiService';
import { RefreshCw, Copy, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

export function RephraseTab() {
  const [input, setInput] = useState('');
  const [tone, setTone] = useState('Professional');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const tones = ['Professional', 'Casual', 'Friendly', 'Formal', 'Concise', 'Expand', 'Empathetic'];

  const handleRephrase = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult('');
    setIsCopied(false);
    try {
      await rephraseText(input, tone, (chunk) => {
        setResult(chunk);
      });
    } catch (error: any) {
      console.error('Error rephrasing text:', error);
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        toast.error('API quota exceeded. Please wait a minute and try again, or add your own API key in Settings.', { duration: 6000 });
      } else {
        toast.error('Failed to rephrase text. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult('');
    setIsCopied(false);
  };

  useEffect(() => {
    const onReset = () => handleReset();
    const onCancel = () => handleReset();
    window.addEventListener('reset-rephrase', onReset);
    window.addEventListener('cancel-rephrase', onCancel);
    return () => {
      window.removeEventListener('reset-rephrase', onReset);
      window.removeEventListener('cancel-rephrase', onCancel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <RefreshCw className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Rephrase Text</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3 relative">
            <label className="block text-sm font-medium text-slate-700">Original text:</label>
            <Textarea
              className="h-40 resize-y bg-slate-50"
              placeholder="Enter text to rephrase..."
              value={input}
              maxLength={5000}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <div className={`absolute bottom-3 right-3 text-xs ${input.length >= 4900 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
              {input.length}/5000
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Tone / Style:</label>
              <select
                className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                {tones.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isLoading || (!input && !result)}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="px-6"
              >
                Reset
              </Button>
              <Button
                onClick={handleRephrase}
                disabled={isLoading || !input.trim()}
                isLoading={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? 'Rephrasing...' : 'Rephrase'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="rephrase-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Rephrased Text</h3>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                {tone}
              </span>
            </div>
            <div className="relative">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap font-sans leading-relaxed min-h-[100px]">
                {result}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="absolute top-3 right-3 bg-white shadow-sm"
                leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              >
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
