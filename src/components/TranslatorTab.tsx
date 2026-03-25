import React, { useState, useRef } from 'react';
import { translateText } from '../services/geminiService';
import { Languages, Copy, CheckCircle2, RotateCcw, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

export function TranslatorTab() {
  const [transInput, setTransInput] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [image, setImage] = useState<{ data: string, mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = ['English', 'Arabic', 'Russian', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

  const handleTranslate = async () => {
    if (!transInput.trim() && !image) return;
    setIsLoading(true);
    setTranslation('');
    setIsCopied(false);
    try {
      await translateText(transInput, targetLanguage, (chunk) => {
        setTranslation(chunk);
      }, image || undefined);
    } catch (error) {
      console.error('Error translating text:', error);
      toast.error('Failed to translate text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (translation) {
      navigator.clipboard.writeText(translation);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setTransInput('');
    setTranslation('');
    setIsCopied(false);
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      const base64Data = result.split(',')[1];
      setImage({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Languages className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Quick Translation</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3 relative">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Text to translate:</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 hover:text-indigo-700"
                leftIcon={<ImagePlus className="w-4 h-4" />}
              >
                Add Image
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            {image && (
              <div className="relative inline-block mb-2">
                <img 
                  src={`data:${image.mimeType};base64,${image.data}`} 
                  alt="To translate" 
                  className="h-20 rounded-lg border border-slate-200 object-cover"
                />
                <button
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <Textarea
              className="h-40 resize-none bg-slate-50"
              placeholder="Enter text here..."
              value={transInput}
              maxLength={5000}
              onChange={(e) => setTransInput(e.target.value)}
              disabled={isLoading}
            />
            <div className={`absolute bottom-3 right-3 text-xs ${transInput.length >= 4900 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
              {transInput.length}/5000
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Translate TO:</label>
              <select
                className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isLoading || (!transInput && !translation && !image)}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="px-6"
              >
                Reset
              </Button>
              <Button
                onClick={handleTranslate}
                disabled={isLoading || (!transInput.trim() && !image)}
                isLoading={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? 'Translating...' : 'Translate'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {translation && (
          <motion.div
            key="translation-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Translation</h3>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                {targetLanguage}
              </span>
            </div>
            <div className="relative">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap font-sans leading-relaxed min-h-[100px]">
                {translation}
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
