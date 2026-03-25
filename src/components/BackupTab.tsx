import React, { useState, useRef } from 'react';
import { Database, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Macro, LinkItem, Template, UpdateItem } from '../types';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';

export function BackupTab() {
  const { macros, links, templates, updates } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const backupData = {
        version: '1.4',
        timestamp: new Date().toISOString(),
        data: {
          macros,
          links,
          templates,
          updates
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `cs-agent-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast.success('Backup exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      if (!parsedData.data) {
        throw new Error('Invalid backup file format');
      }

      const { data } = parsedData;

      if (!db || !auth?.currentUser) {
        toast.error('Database connection or user not available.');
        return;
      }

      const userId = auth.currentUser.uid;

      // We will use a batch to write all data to Firestore
      const batch = writeBatch(db);

      // Import Macros
      if (data.macros && Array.isArray(data.macros)) {
        data.macros.forEach((m: Macro) => {
          const ref = doc(db, 'macros', m.id);
          batch.set(ref, { ...m, userId });
        });
      }

      // Import Links
      if (data.links && Array.isArray(data.links)) {
        data.links.forEach((l: LinkItem) => {
          const ref = doc(db, 'links', l.id);
          batch.set(ref, { ...l, userId });
        });
      }

      // Import Templates
      if (data.templates && Array.isArray(data.templates)) {
        data.templates.forEach((t: Template) => {
          const ref = doc(db, 'templates', t.id);
          batch.set(ref, { ...t, userId });
        });
      }

      // Import Updates
      if (data.updates && Array.isArray(data.updates)) {
        data.updates.forEach((u: UpdateItem) => {
          const ref = doc(db, 'updates', u.id);
          batch.set(ref, { ...u, userId });
        });
      }

      await batch.commit();
      toast.success('Data imported successfully! The app will now reflect the restored data.');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import data. Please ensure the file is a valid backup.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Data Backup & Restore</h2>
        </div>

        <p className="text-slate-600 mb-8 leading-relaxed">
          Safeguard your data by exporting it to a local JSON file. You can use this file to restore your macros, templates, links, and updates later, or transfer them to another device.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
              <Download className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Export Backup</h3>
              <p className="text-sm text-slate-500 mb-4">Download all your current data to a secure JSON file.</p>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              isLoading={isExporting}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isExporting ? 'Exporting...' : 'Download Backup'}
            </Button>
            <div className="w-full pt-4 mt-auto border-t border-slate-200">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Includes {macros.length} Macros, {templates.length} Templates
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
              <Upload className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Restore Data</h3>
              <p className="text-sm text-slate-500 mb-4">Upload a previously exported JSON backup file.</p>
            </div>
            
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              isLoading={isImporting}
              className="w-full"
            >
              {isImporting ? 'Restoring...' : 'Select Backup File'}
            </Button>
            
            <div className="w-full pt-4 mt-auto border-t border-slate-200">
              <div className="flex items-start gap-2 text-xs text-amber-600 text-left bg-amber-50 p-2 rounded-md">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Restoring will merge the backup with your current data. Duplicate items may be overwritten.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
