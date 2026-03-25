import React, { useState } from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export function LoginScreen() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!auth) {
      toast.error('Firebase is not configured.');
      return;
    }

    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to authenticate');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-50 rounded-full">
            <ShieldCheck className="w-12 h-12 text-indigo-600" />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Welcome to CS Agent
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Please sign in with your Google account to access the assistant.
          </p>
        </div>

        <div className="space-y-6">
          <Button
            onClick={handleLogin}
            isLoading={isLoggingIn}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            leftIcon={!isLoggingIn && <LogIn className="w-5 h-5" />}
          >
            {isLoggingIn ? 'Signing In...' : 'Sign in with Google'}
          </Button>
        </div>
      </div>
    </div>
  );
}
