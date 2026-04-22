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
      const apiKeys = [
        "AIzaSyB3yMdd_hbiHfVHuQxgEcnjpQEaz9_Zd0U",
        "AIzaSyBIDLhrLpZl2r5WqwndDCXmPacpwYg87NE",
        "AIzaSyD9n7t8sMxoT0V5KcKo5ZtByZnSMfqgftI",
        "AIzaSyDJmreGlmpXzxJ5rimYlI1k4C7w1QomASc",
        "AIzaSyDzt0vGp0eqJA65T3uFx0Pp5WDxXANtbaE",
        process.env.GEMINI_API_KEY
      ].filter(Boolean) as string[];

      if (apiKeys.length === 0) throw new Error("API key is missing.");
      
      let operation: any = null;
      let usedApiKey = apiKeys[0];
      
      for (let i = 0; i < apiKeys.length; i++) {
        usedApiKey = apiKeys[i];
        const ai = new GoogleGenAI({ apiKey: usedApiKey });
        try {
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: 'A professional explainer video showing a customer support agent using an AI assistant dashboard to draft emails, translate text, and manage macros. Cinematic lighting, high quality.',
            config: {
              numberOfVideos: 1,
              resolution: '1080p',
              aspectRatio: '16:9'
            }
          });
          break; // success
        } catch (err: any) {
             const errorMessage = err.message || '';
             if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                console.warn(`Key ${i+1} exhausted for Veo. Trying next...`);
                // if it's the last key, it will just drop out and we throw
                if (i === apiKeys.length - 1) throw err;
             } else {
                throw err;
             }
        }
      }

      setStatusMessage('Generating video... This may take a few minutes.');
      // We already fetched the operation successfully above.

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const activeAi = new GoogleGenAI({ apiKey: usedApiKey });
        operation = await activeAi.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatusMessage('Fetching video...');
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': usedApiKey || '',
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
      } else if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        setError('API quota exceeded. Please wait a minute and try again, or add your own API key in Settings.');
        toast.error('API quota exceeded.');
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
              <h3 className="text-lg font-medium text-slate-800 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500" />
                API Limits & How to Fix Them
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-slate-700 space-y-3">
                <p>
                  <strong>Why did the AI stop working?</strong><br/>
                  This app uses the free tier of the Gemini AI API, which has strict daily and per-minute limits. If you hit this limit, the AI will temporarily pause.
                </p>
                <p>
                  <strong>The Permanent Fix (Use your own API Key):</strong><br/>
                  To get massive limits, you can use your own Google AI Studio API key.
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Ensure you have a valid Gemini API key.</li>
                  <li>In this app's preview window, open the <strong>Settings / Secrets</strong> panel (usually a gear icon or settings menu in the host environment).</li>
                  <li>Add your Gemini API key there and restart the app.</li>
                </ol>
                <p className="text-xs text-amber-800 mt-2">
                  <em>Don't want to add a key?</em> The free limits reset every day. You can also stretch your limits by waiting for the AI to finish before clicking generate again, or by batching your requests.
                </p>
              </div>
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
