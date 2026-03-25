import React, { useState } from 'react';
import { MapPin, Clock, Search, Info, ExternalLink, AlertTriangle, Map, Navigation } from 'lucide-react';
import { generateTollEstimate } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function TollGatesTab() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [time, setTime] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapRoute, setMapRoute] = useState<{pickup: string, dropoff: string} | null>(null);

  const handleCalculate = async () => {
    if (!pickup || !dropoff || !time) {
      setError('Please fill in all fields (pickup, drop-off, and time).');
      return;
    }

    setIsCalculating(true);
    setError(null);
    setResult(null);
    setMapRoute({ pickup, dropoff });

    try {
      await generateTollEstimate(pickup, dropoff, time, (chunk) => {
        setResult(chunk);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to calculate toll estimate. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <Map className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">UAE Toll Gates</h2>
          <p className="text-slate-600">Information and calculator for Salik (Dubai) and Darb (Abu Dhabi)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-600" />
            Toll Calculator
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Enter your trip details to estimate the toll gates you'll cross and the total cost.
          </p>

          <div className="space-y-4 flex-1">
            <Input
              label="Pick-up Location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="e.g., Dubai Marina"
              leftIcon={<MapPin className="w-5 h-5" />}
            />

            <Input
              label="Drop-off Location"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="e.g., Abu Dhabi Airport"
              leftIcon={<MapPin className="w-5 h-5" />}
            />

            <Input
              type="datetime-local"
              label="Date & Time of Travel"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              leftIcon={<Clock className="w-5 h-5" />}
            />
            <p className="text-xs text-slate-500 mt-1">Time is important as Darb tolls depend on peak hours.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            isLoading={isCalculating}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
            leftIcon={!isCalculating && <Search className="w-4 h-4" />}
          >
            {isCalculating ? 'Calculating...' : 'Calculate Tolls'}
          </Button>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="toll-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <h4 className="font-medium text-slate-800 mb-2">Estimated Tolls</h4>
                <div className="prose prose-sm prose-indigo max-w-none text-slate-700">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {/* Yandex Map Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-indigo-600" />
              Route Map (Yandex)
            </h3>
            <div className="w-full h-[300px] rounded-lg overflow-hidden relative bg-slate-100 border border-slate-200">
              {mapRoute ? (
                <iframe
                  src={`https://yandex.com/map-widget/v1/?rtext=${encodeURIComponent(mapRoute.pickup)}~${encodeURIComponent(mapRoute.dropoff)}&rtt=auto&lang=en_US`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen={true}
                  className="absolute inset-0"
                ></iframe>
              ) : (
                <iframe
                  src="https://yandex.com/map-widget/v1/?ll=54.898804%2C24.857059&z=8&lang=en_US"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen={true}
                  className="absolute inset-0"
                ></iframe>
              )}
            </div>
          </div>

          {/* Salik Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                Salik (Dubai)
              </h3>
              <a
                href="https://www.salik.ae"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                salik.ae <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="space-y-3 text-sm text-slate-600">
              <p><strong>Cost:</strong> 4 AED per crossing.</p>
              <p><strong>Peak Times:</strong> <span className="font-semibold text-indigo-600">None.</span> Dubai charges a flat rate 24/7.</p>
              <p><strong>Gates (8):</strong> Al Barsha, Al Garhoud, Al Maktoum, Al Safa, Airport Tunnel, Al Mamzar South, Al Mamzar North, Jebel Ali.</p>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-orange-800">
                <p className="font-medium mb-1 flex items-center gap-1">
                  <Info className="w-4 h-4" /> Important Rules
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Al Mamzar North & South: Charged once if crossed in the same direction within 1 hour.</li>
                  <li>Al Maktoum Bridge: Toll-free from 10:00 PM to 6:00 AM (Mon-Sat) and all day Sunday.</li>
                  <li>Maximum daily cap: None.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Darb Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Darb (Abu Dhabi)
              </h3>
              <a
                href="https://darb.itc.gov.ae"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                darb.itc.gov.ae <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="space-y-3 text-sm text-slate-600">
              <p><strong>Cost:</strong> 4 AED per crossing <em>during peak hours only</em>.</p>
              <p><strong>Gates (4):</strong> Sheikh Zayed Bridge, Sheikh Khalifa Bridge, Al Maqtaa Bridge, Mussafah Bridge.</p>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                <p className="font-medium mb-1 flex items-center gap-1">
                  <Info className="w-4 h-4" /> Peak Hours & Rules
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Peak Hours: Monday to Saturday, 7:00 AM - 9:00 AM and 5:00 PM - 7:00 PM.</li>
                  <li>Free Times: Sundays and Public Holidays are completely free.</li>
                  <li>Maximum daily cap: 16 AED per vehicle.</li>
                  <li>Maximum monthly cap: 200 AED (first vehicle), 150 AED (second), 100 AED (subsequent).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
