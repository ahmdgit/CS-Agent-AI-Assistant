import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { TutorialModal } from './components/TutorialModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { useAppContext } from './contexts/AppContext';
import { MessageSquarePlus, FolderOpen, Globe2, ShieldCheck, HelpCircle, Link as LinkIcon, Info, LayoutTemplate, AlertCircle, SpellCheck, LayoutDashboard, Menu, X, Lock, Map, Database, Mic, LogOut, Calculator, Save } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Button } from './components/ui/Button';

const DashboardTab = lazy(() => import('./components/DashboardTab').then(m => ({ default: m.DashboardTab })));
const DraftTab = lazy(() => import('./components/DraftTab').then(m => ({ default: m.DraftTab })));
const MacrosTab = lazy(() => import('./components/MacrosTab').then(m => ({ default: m.MacrosTab })));
const TranslatorTab = lazy(() => import('./components/TranslatorTab').then(m => ({ default: m.TranslatorTab })));
const AskCaptainTab = lazy(() => import('./components/AskCaptainTab').then(m => ({ default: m.AskCaptainTab })));
const LinksTab = lazy(() => import('./components/LinksTab').then(m => ({ default: m.LinksTab })));
const TemplatesTab = lazy(() => import('./components/TemplatesTab').then(m => ({ default: m.TemplatesTab })));
const UpdatesTab = lazy(() => import('./components/UpdatesTab').then(m => ({ default: m.UpdatesTab })));
const GrammarCheckTab = lazy(() => import('./components/GrammarCheckTab').then(m => ({ default: m.GrammarCheckTab })));
const TollGatesTab = lazy(() => import('./components/TollGatesTab').then(m => ({ default: m.TollGatesTab })));
const SpeechToTextTab = lazy(() => import('./components/SpeechToTextTab').then(m => ({ default: m.SpeechToTextTab })));
const CalculatorTab = lazy(() => import('./components/CalculatorTab').then(m => ({ default: m.CalculatorTab })));
const BackupTab = lazy(() => import('./components/BackupTab').then(m => ({ default: m.BackupTab })));

type Tab = 'dashboard' | 'draft' | 'macros' | 'translator' | 'askCaptain' | 'links' | 'templates' | 'updates' | 'grammar' | 'tollGates' | 'speechToText' | 'calculator' | 'backup';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { macros, links, templates, updates } = useAppContext();

  useEffect(() => {
    if (!auth) {
      setIsAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        toast.success('Logged out successfully');
      } catch (error) {
        console.error('Logout error', error);
        toast.error('Failed to log out');
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'draft', label: 'AI Draft & Save', icon: MessageSquarePlus },
    { id: 'macros', label: `Macros (${macros.length})`, icon: FolderOpen },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'updates', label: 'Updates', icon: AlertCircle },
    { id: 'translator', label: 'Translator', icon: Globe2 },
    { id: 'speechToText', label: 'Speech to Text', icon: Mic },
    { id: 'grammar', label: 'Grammar Check', icon: SpellCheck },
    { id: 'askCaptain', label: 'Ask Captain', icon: HelpCircle },
    { id: 'tollGates', label: 'Toll Gates', icon: Map },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'backup', label: 'Backup & Restore', icon: Save },
  ] as const;

  if (!isAuthReady) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginScreen />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-2">
              CS Agent
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">v1.4</span>
            </h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-3"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-600 rounded-md shadow-sm">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-2">
                CS Agent
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">v1.4</span>
              </h1>
            </div>
          </div>
          
          <div className="hidden lg:block flex-1"></div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <button
              onClick={() => {
                setIsTutorialOpen(true);
                setIsSidebarOpen(false);
              }}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="How to Use"
            >
              <Info className="w-5 h-5 text-slate-400" />
              <span className="hidden sm:inline">How to Use</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {!db && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
                <Database className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Firebase Database Not Connected</h3>
                  <p className="text-sm mt-1">
                    To save your data permanently, you need to configure Firebase. Please add the following environment variables in the AI Studio Secrets panel:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm space-y-1 font-mono">
                    <li>VITE_FIREBASE_API_KEY</li>
                    <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                    <li>VITE_FIREBASE_PROJECT_ID</li>
                    <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                    <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                    <li>VITE_FIREBASE_APP_ID</li>
                  </ul>
                </div>
              </div>
            )}
            
            <div className="w-full relative">
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
                    <DashboardTab onNavigate={setActiveTab} />
                  </div>
                  <div className={activeTab === 'draft' ? 'block' : 'hidden'}><DraftTab /></div>
                  <div className={activeTab === 'macros' ? 'block' : 'hidden'}><MacrosTab /></div>
                  <div className={activeTab === 'templates' ? 'block' : 'hidden'}><TemplatesTab /></div>
                  <div className={activeTab === 'updates' ? 'block' : 'hidden'}><UpdatesTab /></div>
                  <div className={activeTab === 'translator' ? 'block' : 'hidden'}><TranslatorTab /></div>
                  <div className={activeTab === 'speechToText' ? 'block' : 'hidden'}><SpeechToTextTab /></div>
                  <div className={activeTab === 'grammar' ? 'block' : 'hidden'}><GrammarCheckTab /></div>
                  <div className={activeTab === 'askCaptain' ? 'block' : 'hidden'}><AskCaptainTab /></div>
                  <div className={activeTab === 'tollGates' ? 'block' : 'hidden'}><TollGatesTab /></div>
                  <div className={activeTab === 'calculator' ? 'block' : 'hidden'}><CalculatorTab /></div>
                  <div className={activeTab === 'links' ? 'block' : 'hidden'}><LinksTab /></div>
                  <div className={activeTab === 'backup' ? 'block' : 'hidden'}><BackupTab /></div>
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </main>

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <CommandPalette />
    </div>
  );
}
