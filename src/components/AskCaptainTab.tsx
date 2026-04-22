import React, { useState, useEffect, useMemo } from 'react';
import { generateCaptainRequest } from '../services/geminiService';
import { CaptainRequestResult } from '../types';
import { Copy, CheckCircle2, RotateCcw, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Input } from './ui/Input';

export function AskCaptainTab() {
  const [input, setInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CaptainRequestResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Editable fields state
  const [formValues, setFormValues] = useState({
    ticketLink: '',
    summary: '',
    validation: '',
    needsFromCaptain: ''
  });

  useEffect(() => {
    if (result) {
      setFormValues({
        ticketLink: result.ticketLink || '',
        summary: result.summary || '',
        validation: result.validation || '',
        needsFromCaptain: result.needsFromCaptain || ''
      });
    }
  }, [result]);

  const handleInputChange = (field: keyof typeof formValues, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const generatedText = useMemo(() => {
    return `Ticket Link: ${formValues.ticketLink}\nSummary of issue: ${formValues.summary}\nMy validation: ${formValues.validation}\nWhat I need from captain: ${formValues.needsFromCaptain}`;
  }, [formValues]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    setIsCopied(false);
    try {
      const draft = await generateCaptainRequest(input);
      setResult(draft);
    } catch (error: any) {
      console.error('Error generating captain request:', error);
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        toast.error('API quota exceeded. Please wait a minute and try again, or add your own API key in Settings.', { duration: 6000 });
      } else {
        toast.error('Failed to generate request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedText.trim()) {
      navigator.clipboard.writeText(generatedText);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    setFormValues({ ticketLink: '', summary: '', validation: '', needsFromCaptain: '' });
    setIsCopied(false);
  };



  useEffect(() => {
    const onReset = () => handleReset();
    const onCancel = () => handleReset();
    window.addEventListener('reset-askCaptain', onReset);
    window.addEventListener('cancel-askCaptain', onCancel);
    return () => {
      window.removeEventListener('reset-askCaptain', onReset);
      window.removeEventListener('cancel-askCaptain', onCancel);
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Ask Captain</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Paste your notes, customer messages, or context here. The AI will format it into a clear escalation request for your captain.
        </p>
        <div className="relative">
          <Textarea
            className="h-32 resize-y"
            placeholder="Paste text here..."
            value={input}
            maxLength={5000}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <div className={`absolute bottom-3 right-3 text-xs ${input.length >= 4900 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            {input.length}/5000
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isLoading || (!input && !result)}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !input.trim()}
            isLoading={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? 'Formatting...' : 'Format Request'}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="captain-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Formatted Request</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <h3 className="font-medium text-slate-800 mb-2">Edit Details</h3>
                  
                  <div>
                    <Input
                      label="Ticket Link"
                      value={formValues.ticketLink}
                      onChange={(e) => handleInputChange('ticketLink', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      label="Summary of issue"
                      value={formValues.summary}
                      onChange={(e) => handleInputChange('summary', e.target.value)}
                      className="h-20 resize-y bg-white"
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      label="My validation"
                      value={formValues.validation}
                      onChange={(e) => handleInputChange('validation', e.target.value)}
                      className="h-24 resize-y bg-white"
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      label="What I need from captain"
                      value={formValues.needsFromCaptain}
                      onChange={(e) => handleInputChange('needsFromCaptain', e.target.value)}
                      className="h-24 resize-y bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <label className="block text-sm font-medium text-slate-700 mb-1">Generated Output</label>
                <div className="relative h-full min-h-[250px]">
                  <Textarea
                    readOnly
                    value={generatedText}
                    className="h-full min-h-[250px] bg-slate-50 resize-y"
                    placeholder="Output will appear here..."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!generatedText.trim()}
                    className="absolute top-3 right-3 bg-white shadow-sm"
                    leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  >
                    {isCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
