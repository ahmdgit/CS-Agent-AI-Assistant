import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Macro } from '../types';
import { Search, Trash2, Copy, ChevronDown, ChevronUp, Edit2, Check, X, Plus, Download, Upload, FolderOpen, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';

export function MacrosTab() {
  const { macros, deleteMacro, editMacro, saveMacro, toggleFavoriteMacro } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [editResponse, setEditResponse] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newSummary, setNewSummary] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
  

  return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMacros = useMemo(() => {
    let result = macros.filter(
      (m) =>
        m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.response.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      // Always sort favorites to the top
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      if (sortBy === 'newest') return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      if (sortBy === 'oldest') return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      if (sortBy === 'az') return a.summary.localeCompare(b.summary);
      if (sortBy === 'za') return b.summary.localeCompare(a.summary);
      return 0;
    });

    return result;
  }, [macros, searchQuery, sortBy]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    if (editingId === id) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const startEditing = (macro: Macro) => {
    setEditingId(macro.id);
    setEditSummary(macro.summary);
    setEditResponse(macro.response);
    setExpandedId(macro.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditSummary('');
    setEditResponse('');
  };

  const saveEdit = (id: string) => {
    if (editSummary.trim() && editResponse.trim()) {
      editMacro(id, editSummary, editResponse);
      setEditingId(null);
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewSummary('');
    setNewResponse('');
    setExpandedId(null);
    setEditingId(null);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewSummary('');
    setNewResponse('');
  };

  const saveNewMacro = () => {
    if (newSummary.trim() && newResponse.trim()) {
      saveMacro(newSummary, newResponse);
      setIsCreating(false);
      setNewSummary('');
      setNewResponse('');
    }
  };

  const exportMacros = async (format: string) => {
    setShowExportMenu(false);
    if (macros.length === 0 && format !== 'template') {
      toast.error("No macros to export.");
      return;
    }

    try {
      if (format === 'template') {
        const ExcelJS = await import('exceljs');
        const { saveAs } = await import('file-saver');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template');
        worksheet.columns = [
          { header: 'Summary', key: 'summary', width: 30 },
          { header: 'Response', key: 'response', width: 50 }
        ];
        worksheet.addRow({ summary: "Example Issue (Replace me)", response: "Hello, here is the solution to your issue... (Replace me)" });
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'macro_template.xlsx');
        toast.success('Template downloaded!');
        return;
      }

      if (format === 'json') {
        const { saveAs } = await import('file-saver');
        const dataStr = JSON.stringify(macros, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        saveAs(blob, 'macros.json');
        toast.success('Exported to JSON!');
      } else if (format === 'csv') {
        const Papa = await import('papaparse');
        const { saveAs } = await import('file-saver');
        const csv = Papa.unparse(macros.map(m => ({
          Summary: m.summary,
          Response: m.response,
          DateAdded: new Date(m.dateAdded).toLocaleString()
        })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'macros.csv');
        toast.success('Exported to CSV!');
      } else if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const { saveAs } = await import('file-saver');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Macros');
        worksheet.columns = [
          { header: 'Summary', key: 'summary', width: 30 },
          { header: 'Response', key: 'response', width: 50 },
          { header: 'DateAdded', key: 'dateAdded', width: 20 }
        ];
        macros.forEach(m => {
          worksheet.addRow({
            summary: m.summary,
            response: m.response,
            dateAdded: new Date(m.dateAdded).toLocaleString()
          });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'macros.xlsx');
        toast.success('Exported to Excel!');
      } else if (format === 'txt') {
        const { saveAs } = await import('file-saver');
        let text = '';
        macros.forEach(m => {
          text += `Title: ${m.summary}\nDate: ${new Date(m.dateAdded).toLocaleString()}\nResponse:\n${m.response}\n\n----------------------------------------\n\n`;
        });
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'macros.txt');
        toast.success('Exported to Text!');
      } else if (format === 'word') {
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        const { saveAs } = await import('file-saver');
        const doc = new Document({
          sections: [{
            properties: {},
            children: macros.flatMap(m => [
              new Paragraph({
                children: [new TextRun({ text: `Title: ${m.summary}`, bold: true, size: 28 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: `Date: ${new Date(m.dateAdded).toLocaleString()}`, italics: true, size: 20 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: m.response, size: 24 })],
              }),
              new Paragraph({ text: "----------------------------------------" }),
              new Paragraph({ text: "" }),
            ]),
          }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, 'macros.docx');
        toast.success('Exported to Word!');
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export macros.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const existingSummaries = new Set(macros.map(m => m.summary.toLowerCase()));

    const processImport = (items: { summary: string, response: string }[]) => {
      let count = 0;
      let skipped: string[] = [];
      
      items.forEach(item => {
        if (item.summary && item.response) {
          const summaryLower = item.summary.toLowerCase();
          if (existingSummaries.has(summaryLower)) {
            skipped.push(item.summary);
          } else {
            saveMacro(item.summary, item.response);
            existingSummaries.add(summaryLower);
            count++;
          }
        }
      });
      
      if (count > 0) {
        toast.success(`Imported ${count} macros successfully!`);
      }
      if (skipped.length > 0) {
        toast.error(`Skipped ${skipped.length} duplicates:\n${skipped.slice(0, 3).join(', ')}${skipped.length > 3 ? '...' : ''}`, { duration: 5000 });
      }
      if (count === 0 && skipped.length === 0) {
        toast.error('No valid macros found to import.');
      }
    };

    try {
      if (fileExt === 'json') {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const content = evt.target?.result;
            if (!content) return;
            const parsed = JSON.parse(content as string);
            if (Array.isArray(parsed)) {
              processImport(parsed.map(m => ({ summary: m.summary, response: m.response })));
            }
          } catch (err) {
            toast.error('Invalid JSON format.');
          }
        };
        reader.readAsText(file);
      } else if (fileExt === 'csv') {
        const Papa = await import('papaparse');
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const items = results.data.map((row: any) => ({
              summary: row.Summary || row.summary || row.Title || row.title,
              response: row.Response || row.response || row.Body || row.body
            }));
            processImport(items);
          },
          error: () => {
            toast.error('Failed to parse CSV file.');
          }
        });
      } else if (fileExt === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const content = evt.target?.result;
            if (!content) return;
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(content as ArrayBuffer);
            const worksheet = workbook.worksheets[0];
            
            // Try to find header row to map columns
            let summaryCol = 1;
            let responseCol = 2;
            const firstRow = worksheet.getRow(1);
            firstRow.eachCell((cell, colNumber) => {
              const val = cell.value?.toString().toLowerCase();
              if (val === 'summary' || val === 'title') summaryCol = colNumber;
              if (val === 'response' || val === 'body') responseCol = colNumber;
            });

            const items: { summary: string, response: string }[] = [];
            worksheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return; // Skip header
              const summary = row.getCell(summaryCol).value?.toString();
              const response = row.getCell(responseCol).value?.toString();
              if (summary && response) {
                items.push({ summary, response });
              }
            });
            processImport(items);
          } catch (err) {
            toast.error('Failed to parse Excel file.');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        toast.error('TXT/Word import is not supported yet. Please use JSON, CSV, or XLSX.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error importing file. Please check the format.');
    }
    e.target.value = '';
  };

  useEffect(() => {
    const onReset = () => {
      setSearchQuery('');
      setEditSummary('');
      setEditResponse('');
      setNewSummary('');
      setNewResponse('');
    };
    const onCancel = () => {
      setEditingId(null);
      setIsCreating(false);
      onReset();
    };
    window.addEventListener('reset-macros', onReset);
    window.addEventListener('cancel-macros', onCancel);
    return () => {
      window.removeEventListener('reset-macros', onReset);
      window.removeEventListener('cancel-macros', onCancel);
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md pb-4 pt-2 -mt-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-200/60 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Saved Replies Library</h2>
            <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-sm shadow-sm">
              <Upload className="w-4 h-4" />
              Import
              <input type="file" accept=".xlsx,.csv,.json,.txt" className="hidden" onChange={handleImport} />
            </label>
            
            <div className="relative" ref={exportMenuRef}>
              <Button
                variant="outline"
                onClick={() => setShowExportMenu(!showExportMenu)}
                leftIcon={<Download className="w-4 h-4" />}
                className="bg-white shadow-sm"
              >
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                  <button onClick={() => exportMacros('xlsx')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Excel (.xlsx)</button>
                  <button onClick={() => exportMacros('csv')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">CSV (.csv)</button>
                  <button onClick={() => exportMacros('json')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">JSON (.json)</button>
                  <button onClick={() => exportMacros('txt')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Text (.txt)</button>
                  <button onClick={() => exportMacros('word')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Word (.docx)</button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button onClick={() => exportMacros('template')} className="block w-full text-left px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50">Download Template</button>
                </div>
              )}
            </div>

            <Button
              onClick={startCreating}
              disabled={isCreating}
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-sm"
            >
              Create New
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              leftIcon={<Search className="w-5 h-5" />}
              placeholder="Search macros by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="newest">Sort by: Newest</option>
            <option value="oldest">Sort by: Oldest</option>
            <option value="az">Sort by: A-Z</option>
            <option value="za">Sort by: Z-A</option>
          </select>
        </div>
      </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-indigo-200 rounded-xl overflow-hidden shadow-sm ring-1 ring-indigo-500/20"
            >
            <div className="p-4 bg-indigo-50/50 border-b border-indigo-100">
              <Input
                placeholder="Macro Title (e.g., Password Reset)"
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                autoFocus
                className="bg-white"
              />
            </div>
            <div className="p-4 bg-white">
              <Textarea
                placeholder="Type your response template here..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="h-32"
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={cancelCreating}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNewMacro}
                  disabled={!newSummary.trim() || !newResponse.trim()}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Save Macro
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {filteredMacros.length === 0 && !isCreating ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <FolderOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
              {macros.length === 0 ? 'No macros yet' : 'No matching macros'}
            </h3>
            <p className="text-slate-500 max-w-sm mb-6">
              {macros.length === 0
                ? 'Create your first macro to save time on repetitive responses and keep your communication consistent.'
                : 'Try adjusting your search or filter to find what you are looking for.'}
            </p>
            {macros.length === 0 && (
              <Button
                onClick={startCreating}
                leftIcon={<Plus className="w-4 h-4" />}
                className="shadow-sm mt-6"
              >
                Create Macro
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredMacros.map((macro) => (
              <motion.div
                layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={macro.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-300"
            >
              <div
                onClick={() => toggleExpand(macro.id)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus:bg-slate-50 group cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full pr-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavoriteMacro(macro.id, !!macro.isFavorite); }}
                    className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <Star className={`w-5 h-5 ${macro.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
                  </button>
                  <div className="flex-1">
                    {editingId === macro.id ? (
                      <Input
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className="font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(macro.summary) }} />
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">
                      Added: {new Date(macro.dateAdded).toLocaleString()}
                    </p>
                    {/* Hover preview disabled as requested (kept in code to avoid deletion) */}
                    {expandedId !== macro.id && editingId !== macro.id && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2 hidden animate-in fade-in duration-200">
                        {macro.response.replace(/<[^>]*>?/gm, '')}
                      </p>
                    )}
                  </div>
                  
                  {/* Quick Copy Button */}
                  {editingId !== macro.id && (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopy(macro.id, macro.response); }}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title="Copy Response"
                        leftIcon={copiedId === macro.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      >
                      </Button>
                    </div>
                  )}
                </div>
                {expandedId === macro.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
                )}
              </div>

              {expandedId === macro.id && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="relative">
                    {editingId === macro.id ? (
                      <Textarea
                        value={editResponse}
                        onChange={(e) => setEditResponse(e.target.value)}
                        className="h-32"
                      />
                    ) : (
                      <pre 
                        className="p-4 bg-white rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap font-sans text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(macro.response) }}
                      />
                    )}
                    {editingId !== macro.id && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(macro.id, macro.response)}
                        className="absolute top-2 right-2"
                        leftIcon={copiedId === macro.id ? null : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copiedId === macro.id ? (
                          <span className="text-emerald-600 flex items-center gap-1">Copied!</span>
                        ) : (
                          'Copy'
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {editingId === macro.id ? 'Edit your macro text above.' : 'Copy the text above to use in your chat tool.'}
                    </p>
                    <div className="flex items-center gap-2">
                      {editingId === macro.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            leftIcon={<X className="w-4 h-4" />}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEdit(macro.id)}
                            disabled={!editSummary.trim() || !editResponse.trim()}
                            leftIcon={<Check className="w-4 h-4" />}
                          >
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(macro)}
                            leftIcon={<Edit2 className="w-4 h-4" />}
                            className="text-indigo-600 hover:bg-indigo-50"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMacro(macro.id)}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          </AnimatePresence>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
