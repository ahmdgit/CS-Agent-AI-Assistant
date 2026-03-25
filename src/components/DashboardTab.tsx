import React from 'react';
import { FolderOpen, LayoutTemplate, AlertCircle, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';

interface DashboardTabProps {
  onNavigate: (tab: any) => void;
}

export function DashboardTab({ onNavigate }: DashboardTabProps) {
  const { macros, templates, updates, links } = useAppContext();

  const stats = [
    {
      title: 'Saved Macros',
      count: macros.length,
      icon: FolderOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      tab: 'macros'
    },
    {
      title: 'Form Templates',
      count: templates.length,
      icon: LayoutTemplate,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      tab: 'templates'
    },
    {
      title: 'Important Updates',
      count: updates.length,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      tab: 'updates'
    },
    {
      title: 'Quick Links',
      count: links.length,
      icon: LinkIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      tab: 'links'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-min"
    >
      {/* Welcome Card */}
      <motion.div variants={item} className="md:col-span-3 lg:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-900/5 border border-slate-200/60 p-8 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Welcome to CS Agent Assistant</h2>
        <p className="text-slate-600 leading-relaxed">
          Your all-in-one workspace for customer support. Draft responses, manage macros, stay updated, and more.
        </p>
      </motion.div>

      {/* Stat Cards */}
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div 
            key={idx} 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(stat.tab)}
            className="col-span-1 bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-200/60 p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-900/10 hover:border-indigo-100 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">{stat.count}</h3>
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500">{stat.title}</p>
            </div>
          </motion.div>
        );
      })}

      {/* Quick Tools */}
      <motion.div variants={item} className="md:col-span-3 lg:col-span-2 lg:row-span-2 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-900/5 border border-slate-200/60 p-6 flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Quick Tools</h3>
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <button onClick={() => onNavigate('draft')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left group">
            <div>
              <p className="font-semibold text-slate-800 tracking-tight">AI Draft & Save</p>
              <p className="text-xs text-slate-500 mt-0.5">Generate professional responses instantly</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          <button onClick={() => onNavigate('translator')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left group">
            <div>
              <p className="font-semibold text-slate-800 tracking-tight">Translator</p>
              <p className="text-xs text-slate-500 mt-0.5">Translate text between English and Arabic</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          <button onClick={() => onNavigate('grammar')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left group">
            <div>
              <p className="font-semibold text-slate-800 tracking-tight">Grammar Check</p>
              <p className="text-xs text-slate-500 mt-0.5">Proofread and correct your text</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          <button onClick={() => onNavigate('askCaptain')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left group">
            <div>
              <p className="font-semibold text-slate-800 tracking-tight">Ask Captain</p>
              <p className="text-xs text-slate-500 mt-0.5">Format escalation requests quickly</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          <button onClick={() => onNavigate('tollGates')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left group">
            <div>
              <p className="font-semibold text-slate-800 tracking-tight">Toll Gates</p>
              <p className="text-xs text-slate-500 mt-0.5">Calculate Salik and Darb tolls</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>
      </motion.div>
      
      {/* Need a new template */}
      <motion.div variants={item} className="md:col-span-3 lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl shadow-indigo-900/10 border border-indigo-500/50 p-8 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="p-4 bg-white/10 rounded-2xl mb-6 backdrop-blur-md shadow-lg shadow-black/5">
            <LayoutTemplate className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 tracking-tight">Need a new template?</h3>
          <p className="text-indigo-100 mb-6 max-w-sm leading-relaxed">
            Create structured form templates to standardize your responses and save time on repetitive tasks.
          </p>
          <Button 
            variant="secondary"
            onClick={() => onNavigate('templates')}
            className="px-8 py-3 font-bold rounded-xl shadow-sm tracking-tight"
          >
            Create Template
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
