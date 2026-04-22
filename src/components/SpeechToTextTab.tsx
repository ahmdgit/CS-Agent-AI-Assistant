import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, FileAudio, Loader2 } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';

interface AudioFileItem {
  id: string;
  file: File;
  status: 'idle' | 'transcribing' | 'done' | 'error';
  transcript: string;
}

export function SpeechToTextTab() {
  const [audioFiles, setAudioFiles] = useState<AudioFileItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        status: 'idle' as const,
        transcript: ''
      }));
      setAudioFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(f => {
        const name = f.name.toLowerCase();
        return f.type.startsWith('audio/') || 
               f.type === 'application/ogg' || 
               name.endsWith('.ogx') ||
               name.endsWith('.mov') ||
               name.endsWith('.move') ||
               f.type === 'video/quicktime';
      });
      
      if (validFiles.length > 0) {
        const newFiles = validFiles.map(file => ({
          id: Math.random().toString(36).substring(7),
          file,
          status: 'idle' as const,
          transcript: ''
        }));
        setAudioFiles(prev => [...prev, ...newFiles]);
      } else {
        toast.error('Please upload valid audio files.');
      }
    }
  };

  const handleTranscribe = async () => {
    const filesToTranscribe = audioFiles.filter(f => f.status === 'idle' || f.status === 'error');
    if (filesToTranscribe.length === 0) return;
    
    setAudioFiles(prev => prev.map(f => 
      (f.status === 'idle' || f.status === 'error') ? { ...f, status: 'transcribing', transcript: '' } : f
    ));
    
    await Promise.all(filesToTranscribe.map(async (audioItem) => {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(audioItem.file);
        });
        
        const base64Data = await base64Promise;
        
        let mimeType = audioItem.file.type;
        const fileName = audioItem.file.name.toLowerCase();
        
        // Normalize MIME types for Gemini API
        if (fileName.endsWith('.ogx') || fileName.endsWith('.ogg') || mimeType === 'application/ogg' || mimeType.includes('ogg')) {
          mimeType = 'audio/ogg';
        } else if (fileName.endsWith('.mp3') && (!mimeType || mimeType.includes('mpeg'))) {
          mimeType = 'audio/mp3';
        } else if (fileName.endsWith('.wav') && (!mimeType || mimeType.includes('wav'))) {
          mimeType = 'audio/wav';
        } else if (fileName.endsWith('.m4a') || mimeType.includes('m4a') || mimeType.includes('mp4')) {
          mimeType = 'audio/mp4';
        } else if (fileName.endsWith('.mov') || fileName.endsWith('.move') || mimeType.includes('quicktime') || mimeType.includes('video/mov')) {
          mimeType = 'video/mp4'; // Gemini supports video/mp4 for these formats
        } else if (!mimeType) {
          mimeType = 'audio/ogg'; // Default fallback
        }
        
        const result = await transcribeAudio(base64Data, mimeType);
        
        setAudioFiles(prev => prev.map(f => 
          f.id === audioItem.id ? { ...f, status: 'done', transcript: result } : f
        ));
      } catch (error: any) {
        console.error(error);
        setAudioFiles(prev => prev.map(f => 
          f.id === audioItem.id ? { ...f, status: 'error', transcript: '' } : f
        ));
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          toast.error('API quota exceeded. Please wait a minute and try again, or add your own API key in Settings.', { duration: 6000 });
        } else {
          toast.error(`Failed to transcribe ${audioItem.file.name}`);
        }
      }
    }));
  };

  const isTranscribingAny = audioFiles.some(f => f.status === 'transcribing');
  const hasFilesToTranscribe = audioFiles.some(f => f.status === 'idle' || f.status === 'error');



  useEffect(() => {
    const onReset = () => {
      setAudioFiles([]);
    };
    const onCancel = () => {
      setAudioFiles([]);
    };
    window.addEventListener('reset-speechToText', onReset);
    window.addEventListener('cancel-speechToText', onCancel);
    return () => {
      window.removeEventListener('reset-speechToText', onReset);
      window.removeEventListener('cancel-speechToText', onCancel);
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <Mic className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Speech to Text</h2>
          <p className="text-slate-600">Upload voice messages to get accurate transcripts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="audio/*,.ogx,application/ogg,.mov,.move,video/quicktime" 
              multiple
              className="hidden" 
            />
            
            {audioFiles.length > 0 ? (
              <div className="flex flex-col gap-3 w-full">
                <AnimatePresence mode="popLayout">
                  {audioFiles.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                          <FileAudio className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-slate-800 text-sm truncate max-w-[150px] sm:max-w-[200px]">{item.file.name}</p>
                          <p className="text-xs text-slate-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAudioFiles(prev => prev.filter(f => f.id !== item.id));
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium p-2"
                      >
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Add more files
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-full">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Click or drag audio/video files here</p>
                  <p className="text-sm text-slate-500 mt-1">Supports MP3, WAV, M4A, OGG, OGX, MOV</p>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleTranscribe}
            disabled={!hasFilesToTranscribe || isTranscribingAny}
            isLoading={isTranscribingAny}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
            leftIcon={!isTranscribingAny && <Mic className="w-5 h-5" />}
          >
            {isTranscribingAny ? 'Transcribing...' : 'Transcribe Audio'}
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full min-h-[300px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Transcripts</h3>
          
          <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100 overflow-y-auto text-slate-700 space-y-4">
            {audioFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>Transcripts will appear here</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {audioFiles.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-4 rounded border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                      <FileAudio className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium text-sm text-slate-700 truncate">{item.file.name}</span>
                      {item.status === 'transcribing' && <Loader2 className="w-3 h-3 animate-spin text-indigo-500 ml-auto" />}
                      {item.status === 'error' && <span className="text-xs text-red-500 ml-auto">Failed</span>}
                      {item.status === 'done' && <span className="text-xs text-emerald-500 ml-auto">Done</span>}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {item.status === 'transcribing' ? (
                        <span className="text-slate-400 italic">Transcribing...</span>
                      ) : item.status === 'error' ? (
                        <span className="text-red-400 italic">Error transcribing file.</span>
                      ) : item.transcript ? (
                        item.transcript
                      ) : (
                        <span className="text-slate-400 italic">Ready to transcribe</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          
          {audioFiles.some(f => f.transcript) && (
            <Button
              variant="secondary"
              onClick={() => {
                const allTranscripts = audioFiles
                  .filter(f => f.transcript)
                  .map(f => `--- ${f.file.name} ---\n${f.transcript}`)
                  .join('\n\n');
                navigator.clipboard.writeText(allTranscripts);
                toast.success('All transcripts copied to clipboard');
              }}
              className="mt-4 w-full"
            >
              Copy All to Clipboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

