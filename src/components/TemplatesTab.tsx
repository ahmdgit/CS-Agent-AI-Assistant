import React, { useState, useMemo, useEffect } from 'react';
import { Template, TemplateField } from '../types';
import { Plus, Trash2, Copy, CheckCircle2, Edit2, X, Save, LayoutTemplate, ChevronDown, Settings, FileText, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Modal } from './ui/Modal';

export function TemplatesTab() {
  const { templates, addTemplate, editTemplate, deleteTemplate, toggleFavoriteTemplate } = useAppContext();
  const [activeTemplateId, setActiveTemplateId] = useState<string>(templates[0]?.id || '');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isCopied, setIsCopied] = useState(false);

  // Edit/Create State
  const [isEditing, setIsEditing] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFields, setEditFields] = useState<TemplateField[]>([]);

  // Manage Options State
  const [managingFieldId, setManagingFieldId] = useState<string | null>(null);
  const [tempOptions, setTempOptions] = useState<string[]>([]);

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [templates]);

  const activeTemplate = useMemo(() => templates.find(t => t.id === activeTemplateId), [templates, activeTemplateId]);

  const startManagingOptions = (field: TemplateField) => {
    setManagingFieldId(field.id);
    setTempOptions([...(field.options || [])]);
  };

  const saveManagedOptions = () => {
    if (!activeTemplate || !managingFieldId) return;
    const updatedFields = activeTemplate.fields.map(f => 
      f.id === managingFieldId ? { ...f, options: tempOptions.filter(o => o.trim() !== '') } : f
    );
    editTemplate(activeTemplate.id, activeTemplate.name, updatedFields);
    setManagingFieldId(null);
    toast.success('Options updated!');
  };

  // Reset form values when template changes
  useEffect(() => {
    setFormValues({});
  }, [activeTemplateId]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const generatedText = useMemo(() => {
    if (!activeTemplate) return '';
    return activeTemplate.fields.map(f => `${f.label} : ${formValues[f.id] || ''}`).join('\n');
  }, [activeTemplate, formValues]);

  const handleCopy = () => {
    if (!generatedText.trim()) return;
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const startCreating = () => {
    setIsEditing(true);
    setEditTemplateId(null);
    setEditName('');
    setEditFields([{ id: crypto.randomUUID(), label: '', type: 'text' }]);
  };

  const startEditing = (template: Template) => {
    setIsEditing(true);
    setEditTemplateId(template.id);
    setEditName(template.name);
    setEditFields([...template.fields]);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditTemplateId(null);
    setEditName('');
    setEditFields([]);
  };

  const saveTemplate = () => {
    if (!editName.trim()) {
      toast.error('Template name is required.');
      return;
    }
    const validFields = editFields.filter(f => f.label.trim() !== '');
    if (validFields.length === 0) {
      toast.error('At least one field is required.');
      return;
    }

    if (editTemplateId) {
      editTemplate(editTemplateId, editName, validFields);
      toast.success('Template updated!');
    } else {
      addTemplate(editName, validFields);
      toast.success('Template created!');
      // Set active to the newly created one (we don't have the ID immediately, but it will be first in list usually, or we can just leave it)
    }
    cancelEditing();
  };

  const addField = () => {
    setEditFields(prev => [...prev, { id: crypto.randomUUID(), label: '', type: 'text' }]);
  };

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    setEditFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setEditFields(prev => prev.filter(f => f.id !== id));
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">
            {editTemplateId ? 'Edit Template' : 'Create New Template'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={cancelEditing}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={saveTemplate}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Template
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Input
              label="Template Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g., Oman partial refund"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Fields</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addField}
                leftIcon={<Plus className="w-4 h-4" />}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Add Field
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {editFields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative"
                >
                  <button
                    onClick={() => removeField(field.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                    <div>
                      <Input
                        label="Field Label"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="e.g., Ticket link"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Field Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as 'text' | 'dropdown' })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        <option value="text">Text Input</option>
                        <option value="dropdown">Dropdown Menu</option>
                      </select>
                    </div>
                  </div>

                  {field.type === 'dropdown' && (
                    <div className="mt-3">
                      <Input
                        label="Dropdown Options (comma-separated)"
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="e.g., Damaged item, Late delivery, Other"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {editFields.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-300 rounded-lg">
                No fields added yet. Click "Add Field" to start.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <LayoutTemplate className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Form Templates</h2>
          </div>
          <Button
            onClick={startCreating}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-sm"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <LayoutTemplate className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">No templates yet</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              Create structured form templates to standardize your responses and save time on repetitive tasks.
            </p>
            <Button
              onClick={startCreating}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              Create Template
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Template</label>
                <div className="relative">
                  <select
                    value={activeTemplateId}
                    onChange={(e) => setActiveTemplateId(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none font-medium text-slate-800"
                  >
                    {sortedTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.isFavorite ? '★ ' : ''}{t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {activeTemplate && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleFavoriteTemplate(activeTemplate.id, !!activeTemplate.isFavorite)}
                        className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        <Star className={`w-5 h-5 ${activeTemplate.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
                      </button>
                      <h3 className="font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeTemplate.name) }} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(activeTemplate)}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Edit Template"
                        leftIcon={<Edit2 className="w-4 h-4" />}
                      >
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this template?')) {
                            deleteTemplate(activeTemplate.id);
                            if (templates.length > 1) {
                              setActiveTemplateId(templates.find(t => t.id !== activeTemplate.id)?.id || '');
                            }
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Template"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                      </Button>
                    </div>
                  </div>

                  {activeTemplate.fields.map(field => (
                    <div key={field.id}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(field.label) }} />
                        {field.type === 'dropdown' && (
                          <button
                            onClick={() => startManagingOptions(field)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" /> Manage Options
                          </button>
                        )}
                      </div>
                      {managingFieldId === field.id ? (
                        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 space-y-2">
                          {tempOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input 
                                value={opt} 
                                onChange={(e) => {
                                  const newOpts = [...tempOptions];
                                  newOpts[idx] = e.target.value;
                                  setTempOptions(newOpts);
                                }}
                                placeholder="Option text..."
                              />
                              <Button variant="ghost" size="sm" onClick={() => {
                                const newOpts = tempOptions.filter((_, i) => i !== idx);
                                setTempOptions(newOpts);
                              }} className="text-slate-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4"/>
                              </Button>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => setTempOptions([...tempOptions, ''])} className="text-indigo-600 hover:text-indigo-700 mt-2" leftIcon={<Plus className="w-3 h-3"/>}>
                            Add Option
                          </Button>
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-200">
                            <Button variant="ghost" size="sm" onClick={() => setManagingFieldId(null)}>Cancel</Button>
                            <Button size="sm" onClick={saveManagedOptions} className="bg-indigo-600 hover:bg-indigo-700">Save Options</Button>
                          </div>
                        </div>
                      ) : field.type === 'dropdown' ? (
                        <select
                          value={formValues[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select an option...</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          value={formValues[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              <label className="block text-sm font-medium text-slate-700 mb-1">Generated Output</label>
              <div className="relative h-full min-h-[250px]">
                <Textarea
                  readOnly
                  value={generatedText}
                  className="h-full min-h-[250px] bg-slate-50"
                  placeholder="Output will appear here..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!generatedText.trim()}
                  className="absolute top-3 right-3 bg-white shadow-sm"
                  leftIcon={isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                >
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
