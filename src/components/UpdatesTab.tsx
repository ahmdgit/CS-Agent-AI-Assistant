import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UpdateItem, Severity } from '../types';
import { Search, Trash2, Copy, ChevronDown, ChevronUp, Edit2, Check, X, Plus, Download, Upload, AlertCircle, Link as LinkIcon, Image as ImageIcon, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';

export function UpdatesTab() {
  const { updates, deleteUpdate, editUpdate, saveUpdate } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSeverity, setEditSeverity] = useState<Severity>('Medium');
  const [editLink, setEditLink] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSeverity, setNewSeverity] = useState<Severity>('Medium');
  const [newLink, setNewLink] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
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

  const filteredUpdates = useMemo(() => updates.filter(
    (u) =>
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.content.toLowerCase().includes(searchQuery.toLowerCase())
  ), [updates, searchQuery]);

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

  const startEditing = (update: UpdateItem) => {
    setEditingId(update.id);
    setEditTitle(update.title);
    setEditContent(update.content);
    setEditSeverity(update.severity || 'Medium');
    setEditLink(update.link || '');
    setEditImageUrl(update.imageUrl || '');
    setExpandedId(update.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditSeverity('Medium');
    setEditLink('');
    setEditImageUrl('');
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim() && editContent.trim()) {
      editUpdate(id, editTitle, editContent, editSeverity, editLink, editImageUrl);
      setEditingId(null);
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewTitle('');
    setNewContent('');
    setNewSeverity('Medium');
    setNewLink('');
    setNewImageUrl('');
    setExpandedId(null);
    setEditingId(null);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
    setNewSeverity('Medium');
    setNewLink('');
    setNewImageUrl('');
  };

  const saveNewUpdate = () => {
    if (newTitle.trim() && newContent.trim()) {
      saveUpdate(newTitle, newContent, newSeverity, newLink, newImageUrl);
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      setNewSeverity('Medium');
      setNewLink('');
      setNewImageUrl('');
      toast.success('Update created successfully!');
    }
  };

  const exportUpdates = async (format: string) => {
    setShowExportMenu(false);
    if (updates.length === 0 && format !== 'template') {
      toast.error("No updates to export.");
      return;
    }

    try {
      if (format === 'template') {
        const ExcelJS = await import('exceljs');
        const { saveAs } = await import('file-saver');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template');
        worksheet.columns = [
          { header: 'Title', key: 'title', width: 30 },
          { header: 'Content', key: 'content', width: 50 }
        ];
        worksheet.addRow({ title: "Example Update (Replace me)", content: "Here is the new policy... (Replace me)" });
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'update_template.xlsx');
        toast.success('Template downloaded!');
        return;
      }

      if (format === 'json') {
        const { saveAs } = await import('file-saver');
        const dataStr = JSON.stringify(updates, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        saveAs(blob, 'updates.json');
        toast.success('Exported to JSON!');
      } else if (format === 'csv') {
        const Papa = await import('papaparse');
        const { saveAs } = await import('file-saver');
        const csv = Papa.unparse(updates.map(u => ({
          Title: u.title,
          Content: u.content,
          DateAdded: new Date(u.dateAdded).toLocaleString()
        })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'updates.csv');
        toast.success('Exported to CSV!');
      } else if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const { saveAs } = await import('file-saver');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Updates');
        worksheet.columns = [
          { header: 'Title', key: 'title', width: 30 },
          { header: 'Content', key: 'content', width: 50 },
          { header: 'DateAdded', key: 'dateAdded', width: 20 }
        ];
        updates.forEach(u => {
          worksheet.addRow({
            title: u.title,
            content: u.content,
            dateAdded: new Date(u.dateAdded).toLocaleString()
          });
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'updates.xlsx');
        toast.success('Exported to Excel!');
      } else if (format === 'txt') {
        const { saveAs } = await import('file-saver');
        let text = '';
        updates.forEach(u => {
          text += `Title: ${u.title}\nDate: ${new Date(u.dateAdded).toLocaleString()}\nContent:\n${u.content}\n\n----------------------------------------\n\n`;
        });
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'updates.txt');
        toast.success('Exported to Text!');
      } else if (format === 'word') {
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        const { saveAs } = await import('file-saver');
        const doc = new Document({
          sections: [{
            properties: {},
            children: updates.flatMap(u => [
              new Paragraph({
                children: [new TextRun({ text: `Title: ${u.title}`, bold: true, size: 28 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: `Date: ${new Date(u.dateAdded).toLocaleString()}`, italics: true, size: 20 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: u.content, size: 24 })],
              }),
              new Paragraph({ text: "----------------------------------------" }),
              new Paragraph({ text: "" }),
            ]),
          }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, 'updates.docx');
        toast.success('Exported to Word!');
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export updates.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExt === 'json') {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const content = evt.target?.result;
            if (!content) return;
            const parsed = JSON.parse(content as string);
            if (Array.isArray(parsed)) {
              let count = 0;
              parsed.forEach(u => {
                if ((u.title || u.summary) && (u.content || u.response)) {
                  saveUpdate(u.title || u.summary, u.content || u.response);
                  count++;
                }
              });
              toast.success(`Imported ${count} updates successfully!`);
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
            let count = 0;
            results.data.forEach((row: any) => {
              const title = row.Title || row.title || row.Summary || row.summary;
              const content = row.Content || row.content || row.Response || row.response || row.Body || row.body;
              if (title && content) {
                saveUpdate(title, content);
                count++;
              }
            });
            toast.success(`Imported ${count} updates successfully!`);
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
            let count = 0;
            
            let titleCol = 1;
            let contentCol = 2;
            const firstRow = worksheet.getRow(1);
            firstRow.eachCell((cell, colNumber) => {
              const val = cell.value?.toString().toLowerCase();
              if (val === 'title' || val === 'summary') titleCol = colNumber;
              if (val === 'content' || val === 'response' || val === 'body') contentCol = colNumber;
            });

            worksheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return; // Skip header
              const title = row.getCell(titleCol).value?.toString();
              const content = row.getCell(contentCol).value?.toString();
              if (title && content) {
                saveUpdate(title, content);
                count++;
              }
            });
            toast.success(`Imported ${count} updates successfully!`);
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Important Updates</h2>
          </div>
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
                  <button onClick={() => exportUpdates('xlsx')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Excel (.xlsx)</button>
                  <button onClick={() => exportUpdates('csv')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">CSV (.csv)</button>
                  <button onClick={() => exportUpdates('json')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">JSON (.json)</button>
                  <button onClick={() => exportUpdates('txt')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Text (.txt)</button>
                  <button onClick={() => exportUpdates('word')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Word (.docx)</button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button onClick={() => exportUpdates('template')} className="block w-full text-left px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50">Download Template</button>
                </div>
              )}
            </div>

            <Button
              onClick={startCreating}
              disabled={isCreating}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-amber-600 hover:bg-amber-700 shadow-sm"
            >
              Add Update
            </Button>
          </div>
        </div>
        <div className="relative">
          <Input
            leftIcon={<Search className="w-5 h-5" />}
            placeholder="Search updates by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
              className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm ring-1 ring-amber-500/20"
            >
              <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Update Title (e.g., New Refund Policy)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  className="bg-white"
                />
              </div>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as Severity)}
                className="px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white font-medium text-slate-700"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="p-4 bg-white space-y-3">
              <Textarea
                placeholder="Type the update details here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="h-32"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="url"
                    placeholder="Optional Link (e.g., https://...)"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    leftIcon={<LinkIcon className="w-4 h-4" />}
                  />
                </div>
                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Image URL or upload..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      leftIcon={<ImageIcon className="w-4 h-4" />}
                    />
                  </div>
                  <label className="flex items-center justify-center px-3 py-2 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors" title="Upload Image">
                    <Upload className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Image must be less than 5MB');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setNewImageUrl(evt.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={cancelCreating}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNewUpdate}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  leftIcon={<Check className="w-4 h-4" />}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Save Update
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {filteredUpdates.length === 0 && !isCreating ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm"
          >
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <Bell className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
              {updates.length === 0 ? 'No updates yet' : 'No matching updates'}
            </h3>
            <p className="text-slate-500 max-w-sm mb-6">
              {updates.length === 0
                ? 'Keep your team informed by adding important announcements, policy changes, or alerts here.'
                : 'Try adjusting your search to find what you are looking for.'}
            </p>
            {updates.length === 0 && (
              <Button
                onClick={startCreating}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-amber-600 hover:bg-amber-700 shadow-sm mt-6"
              >
                Add Update
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredUpdates.map((update) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={update.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-300"
              >
                <div
                onClick={() => toggleExpand(update.id)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full pr-4">
                  <span className="text-xl">
                    {update.severity === 'Critical' ? '🚨' : update.severity === 'High' ? '🔴' : update.severity === 'Medium' ? '🟡' : '🟢'}
                  </span>
                  <div className="flex-1">
                    {editingId === update.id ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <select
                          value={editSeverity}
                          onChange={(e) => setEditSeverity(e.target.value as Severity)}
                          className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(update.title) }} />
                        {update.severity && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            update.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            update.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            update.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {update.severity}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">
                      Added: {new Date(update.dateAdded).toLocaleString()}
                    </p>
                  </div>
                </div>
                {expandedId === update.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </div>

              {expandedId === update.id && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="relative space-y-3">
                    {editingId === update.id ? (
                      <>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-32"
                        />
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <Input
                              type="url"
                              placeholder="Optional Link (e.g., https://...)"
                              value={editLink}
                              onChange={(e) => setEditLink(e.target.value)}
                              leftIcon={<LinkIcon className="w-4 h-4" />}
                            />
                          </div>
                          <div className="flex-1 flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="text"
                                placeholder="Image URL or upload..."
                                value={editImageUrl}
                                onChange={(e) => setEditImageUrl(e.target.value)}
                                leftIcon={<ImageIcon className="w-4 h-4" />}
                              />
                            </div>
                            <label className="flex items-center justify-center px-3 py-2 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors" title="Upload Image">
                              <Upload className="w-4 h-4" />
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error('Image must be less than 5MB');
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (evt) => {
                                      setEditImageUrl(evt.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }} 
                              />
                            </label>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <pre 
                          className="p-4 bg-white rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap font-sans text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(update.content) }}
                        />
                        {update.imageUrl && (
                          <div className="mt-3">
                            <img src={update.imageUrl} alt="Update attachment" className="max-h-64 rounded-lg border border-slate-200 object-contain bg-white" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {update.link && (
                          <div className="mt-3">
                            <a href={DOMPurify.sanitize(update.link)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                              <LinkIcon className="w-4 h-4" />
                              {DOMPurify.sanitize(update.link)}
                            </a>
                          </div>
                        )}
                      </>
                    )}
                    {editingId !== update.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(update.id, update.content)}
                        className="absolute top-2 right-2 text-slate-600"
                      >
                        {copiedId === update.id ? (
                          <span className="text-emerald-600 flex items-center gap-1">Copied!</span>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {editingId === update.id ? 'Edit your update text above.' : 'Copy the text above if needed.'}
                    </p>
                    <div className="flex items-center gap-2">
                      {editingId === update.id ? (
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
                            onClick={() => saveEdit(update.id)}
                            disabled={!editTitle.trim() || !editContent.trim()}
                            leftIcon={<Check className="w-4 h-4" />}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(update)}
                            leftIcon={<Edit2 className="w-4 h-4" />}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUpdate(update.id)}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      </div>
    </div>
  );
}
