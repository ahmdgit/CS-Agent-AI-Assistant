import React, { useState } from 'react';
import { X, Play, Loader2, Video, Info } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage('Checking API key...');

    try {
      // @ts-ignore
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }

      setStatusMessage('Initializing Veo 3...');
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey });

      setStatusMessage('Generating video... This may take a few minutes.');
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: 'A professional explainer video showing a customer support agent using an AI assistant dashboard to draft emails, translate text, and manage macros. Cinematic lighting, high quality.',
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatusMessage('Fetching video...');
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey || '',
          },
        });
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setStatusMessage('');
        toast.success('Video generated successfully!');
      } else {
        throw new Error('No video URI returned.');
      }

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('Requested entity was not found') || errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
        setError('API Key error or permission denied. Please ensure you select a valid paid API key with access to Veo 3.');
        toast.error('API Key error or permission denied.');
        // @ts-ignore
        if (window.aistudio) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      } else {
        const msg = err.message || 'Failed to generate video.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" />
            How to Use CS Agent Assistant
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">Quick Hints</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-2"><span className="text-indigo-600 font-bold">•</span> <span><strong className="text-slate-800">AI Draft & Save:</strong> Paste customer messages to get AI-generated replies. You can adjust the tone between Professional and Empathy Professional.</span></li>
                <li className="flex gap-2"><span className="text-indigo-600 font-bold">•</span> <span><strong className="text-slate-800">Macros:</strong> Save, edit, import (Excel, CSV, JSON), and export your frequently used replies for quick access.</span></li>
                <li className="flex gap-2"><span className="text-indigo-600 font-bold">•</span> <span><strong className="text-slate-800">Translator:</strong> Quickly translate text to different languages to assist global customers.</span></li>
                <li className="flex gap-2"><span className="text-indigo-600 font-bold">•</span> <span><strong className="text-slate-800">Ask Captain:</strong> Format messy customer issues and notes into clear, structured escalation requests for your manager.</span></li>
                <li className="flex gap-2"><span className="text-indigo-600 font-bold">•</span> <span><strong className="text-slate-800">Links:</strong> Save and manage important URLs like internal knowledge bases or policies.</span></li>
                <li className="flex gap-2"><span className="text-indigo-600 font-bold">•</span> <span><strong className="text-slate-800">Calculator:</strong> Perform basic calculations or switch to scientific mode for advanced mathematical operations.</span></li>
                <li className="flex gap-2"><span className="text-indigo-600 font-bold">•</span> <span><strong className="text-slate-800">Backup & Restore:</strong> Export all your app data (macros, links, templates, updates) to a JSON file and import it later.</span></li>
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-lg font-medium text-slate-800 mb-2 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                Video Tutorial
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Generate a custom video tutorial explaining the app using Google Veo 3. 
                <br/>
                <span className="text-xs text-slate-500 italic">Note: This requires a paid Google Cloud API key. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">billing documentation</a>. Generation takes a few minutes.</span>
              </p>

              {!videoUrl && !isGenerating && (
                <Button
                  onClick={handleGenerateVideo}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  leftIcon={<Play className="w-4 h-4" />}
                >
                  Generate Video with Veo 3
                </Button>
              )}

              {isGenerating && (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-200">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-700 font-medium">{statusMessage}</p>
                  <p className="text-sm text-slate-500 mt-2 text-center max-w-md">
                    Veo 3 is rendering your video. Please do not close this window. This process typically takes 2-3 minutes.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm mt-4">
                  {error}
                </div>
              )}

              {videoUrl && (
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
                  <video 
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
