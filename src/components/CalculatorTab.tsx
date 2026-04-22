import React, { useState, useEffect } from 'react';
import { Calculator, Delete, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CalculatorTab() {
  const [display, setDisplay] = useState('0');

  const [equation, setEquation] = useState('');
  const [isScientific, setIsScientific] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    if (display === 'Error') return;
    try {
      // Replace symbols for evaluation
      let evalString = equation + display;
      evalString = evalString.replace(/×/g, '*').replace(/÷/g, '/');
      
      // Basic evaluation (using Function to avoid eval)
      const result = new Function('return ' + evalString)();
      
      if (!isFinite(result) || isNaN(result)) {
        setDisplay('Error');
      } else {
        // Format to avoid long decimals
        setDisplay(String(Math.round(result * 100000000) / 100000000));
      }
      setEquation('');
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleDelete = () => {
    if (display === 'Error') {
      setDisplay('0');
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleScientific = (func: string) => {
    if (display === 'Error') return;
    const num = parseFloat(display);
    let result = 0;

    try {
      switch (func) {
        case 'sin': result = Math.sin(num); break;
        case 'cos': result = Math.cos(num); break;
        case 'tan': result = Math.tan(num); break;
        case 'log': result = Math.log10(num); break;
        case 'ln': result = Math.log(num); break;
        case 'sqrt': result = Math.sqrt(num); break;
        case 'sq': result = Math.pow(num, 2); break;
        case 'pi': result = Math.PI; break;
        case 'e': result = Math.E; break;
      }
      
      if (!isFinite(result) || isNaN(result)) {
        setDisplay('Error');
      } else {
        setDisplay(String(Math.round(result * 100000000) / 100000000));
      }
    } catch (e) {
      setDisplay('Error');
    }
  };



  useEffect(() => {
    const onReset = () => {
      setDisplay('0');
      setEquation('');
    };
    const onCancel = () => {
      setDisplay('0');
      setEquation('');
    };
    window.addEventListener('reset-calculator', onReset);
    window.addEventListener('cancel-calculator', onCancel);
    return () => {
      window.removeEventListener('reset-calculator', onReset);
      window.removeEventListener('cancel-calculator', onCancel);
    };
  }, []);
  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border-4 border-slate-800 p-6 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 font-medium text-sm tracking-wider uppercase">Calc Pro</span>
          </div>
          <button
            onClick={() => setIsScientific(!isScientific)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
              isScientific 
                ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Scientific
          </button>
        </div>

        {/* Display */}
        <div className="mb-6 flex flex-col items-end justify-end h-24">
          <div className="text-slate-400 text-right h-6 text-sm font-medium tracking-wider mb-2 w-full truncate">
            {equation}
          </div>
          <div className="text-white text-right text-5xl font-light tracking-tight w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
          {/* Scientific Controls */}
          <AnimatePresence>
            {isScientific && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="col-span-4 grid grid-cols-5 gap-2"
              >
                <button onClick={() => handleScientific('sin')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">sin</button>
                <button onClick={() => handleScientific('cos')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">cos</button>
                <button onClick={() => handleScientific('tan')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">tan</button>
                <button onClick={() => handleScientific('pi')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">π</button>
                <button onClick={() => handleScientific('e')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">e</button>
                
                <button onClick={() => handleScientific('log')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">log</button>
                <button onClick={() => handleScientific('ln')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">ln</button>
                <button onClick={() => handleScientific('sqrt')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">√</button>
                <button onClick={() => handleScientific('sq')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">x²</button>
                <button onClick={() => handleOperator('^')} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl font-medium text-xs transition-all active:scale-95">x^y</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Row */}
          <button onClick={handleClear} className="col-span-2 p-4 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-2xl font-semibold text-lg transition-all active:scale-95 flex items-center justify-center gap-2">
            AC
          </button>
          <button onClick={handleDelete} className="p-4 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl font-semibold text-lg transition-all active:scale-95 flex items-center justify-center">
            <Delete className="w-5 h-5" />
          </button>
          <button onClick={() => handleOperator('÷')} className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-2xl transition-all active:scale-95">÷</button>

          {/* Numbers & Basic Operators */}
          <button onClick={() => handleNumber('7')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">7</button>
          <button onClick={() => handleNumber('8')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">8</button>
          <button onClick={() => handleNumber('9')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">9</button>
          <button onClick={() => handleOperator('×')} className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-2xl transition-all active:scale-95">×</button>

          <button onClick={() => handleNumber('4')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">4</button>
          <button onClick={() => handleNumber('5')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">5</button>
          <button onClick={() => handleNumber('6')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">6</button>
          <button onClick={() => handleOperator('-')} className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-2xl transition-all active:scale-95">-</button>

          <button onClick={() => handleNumber('1')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">1</button>
          <button onClick={() => handleNumber('2')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">2</button>
          <button onClick={() => handleNumber('3')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">3</button>
          <button onClick={() => handleOperator('+')} className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-2xl transition-all active:scale-95">+</button>

          <button onClick={() => handleNumber('0')} className="col-span-2 p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">0</button>
          <button onClick={() => handleNumber('.')} className="p-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl font-medium text-2xl transition-all active:scale-95">.</button>
          <button onClick={calculate} className="p-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-semibold text-2xl transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.4)]">=</button>
        </div>
      </div>
    </div>
  );
}
