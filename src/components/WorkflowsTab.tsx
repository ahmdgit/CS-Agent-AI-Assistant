import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Workflow, WorkflowNode, WorkflowOption } from '../types';
import { Plus, Play, Edit2, Trash2, Copy, ArrowLeft, Save, X, Waypoints, Search, Star, MessageSquare, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import ExcelJS from 'exceljs';

export function WorkflowsTab() {
  const { workflows, saveWorkflow, editWorkflow, deleteWorkflow, toggleFavoriteWorkflow } = useAppContext();
  const [view, setView] = useState<'list' | 'playing' | 'building'>('list');

  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Builder State
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNodes, setEditNodes] = useState<WorkflowNode[]>([]);
  const [editStartingNodeId, setEditStartingNodeId] = useState<string | null>(null);

  // Player State
  const [history, setHistory] = useState<string[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

  // Delete Confirmation State
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
  

  return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startBuilding = (workflow?: Workflow) => {
    if (workflow) {
      setActiveWorkflow(workflow);
      setEditName(workflow.name);
      setEditDescription(workflow.description);
      setEditNodes(workflow.nodes);
      setEditStartingNodeId(workflow.startingNodeId);
    } else {
      setActiveWorkflow(null);
      setEditName('');
      setEditDescription('');
      setEditNodes([]);
      setEditStartingNodeId(null);
    }
    setView('building');
  };

  const startPlaying = (workflow: Workflow) => {
    setActiveWorkflow(workflow);
    setCurrentNodeId(workflow.startingNodeId);
    setHistory([]);
    setView('playing');
  };

  const handleSaveWorkflow = async () => {
    if (!editName.trim()) {
      toast.error('Workflow name is required');
      return;
    }
    if (editNodes.length === 0) {
      toast.error('Add at least one step to the workflow');
      return;
    }
    if (!editStartingNodeId) {
      toast.error('Please select a starting step');
      return;
    }

    try {
      const workflowData = {
        name: editName,
        description: editDescription,
        nodes: editNodes,
        startingNodeId: editStartingNodeId
      };

      if (activeWorkflow) {
        await editWorkflow(activeWorkflow.id, workflowData);
        toast.success('Workflow updated successfully');
      } else {
        await saveWorkflow(workflowData);
        toast.success('Workflow created successfully');
      }
      setView('list');
    } catch (error) {
      toast.error('Failed to save workflow');
    }
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflowToDelete(id);
  };

  const confirmDeleteWorkflow = async () => {
    if (workflowToDelete) {
      try {
        await deleteWorkflow(workflowToDelete);
        toast.success('Workflow deleted');
      } catch (error) {
        toast.error('Failed to delete workflow');
      } finally {
        setWorkflowToDelete(null);
      }
    }
  };

  // Builder Helpers
  const addNode = () => {
    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      title: 'New Step',
      content: '',
      type: 'question',
      options: []
    };
    setEditNodes([...editNodes, newNode]);
    if (!editStartingNodeId) setEditStartingNodeId(newNode.id);
  };

  const updateNode = (id: string, updates: Partial<WorkflowNode>) => {
    setEditNodes(editNodes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const removeNode = (id: string) => {
    if (editStartingNodeId === id) {
      setEditStartingNodeId(null);
    }
    setEditNodes(prev => {
      // First filter out the node
      const filtered = prev.filter(n => n.id !== id);
      // Then remove any references to it in other nodes' options
      return filtered.map(n => ({
        ...n,
        options: n.options.map(o => o.nextNodeId === id ? { ...o, nextNodeId: null } : o)
      }));
    });
  };

  const addOption = (nodeId: string) => {
    setEditNodes(editNodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          options: [...n.options, { id: crypto.randomUUID(), label: 'New Option', nextNodeId: null }]
        };
      }
      return n;
    }));
  };

  const updateOption = (nodeId: string, optionId: string, updates: Partial<WorkflowOption>) => {
    setEditNodes(editNodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          options: n.options.map(o => o.id === optionId ? { ...o, ...updates } : o)
        };
      }
      return n;
    }));
  };

  const removeOption = (nodeId: string, optionId: string) => {
    setEditNodes(editNodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          options: n.options.filter(o => o.id !== optionId)
        };
      }
      return n;
    }));
  };

  // Player Helpers
  const handleOptionClick = (nextNodeId: string | null) => {
    if (nextNodeId && currentNodeId) {
      setHistory([...history, currentNodeId]);
      setCurrentNodeId(nextNodeId);
    } else {
      toast.error('This option does not lead anywhere yet.');
    }
  };

  const handleBack = () => {
    const newHistory = [...history];
    const prevId = newHistory.pop();
    if (prevId) {
      setHistory(newHistory);
      setCurrentNodeId(prevId);
    }
  };

  const copyResolution = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Resolution copied to clipboard!');
  };

  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(workflows, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflows_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Workflows exported successfully!');
    } catch (error) {
      toast.error('Failed to export workflows.');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!Array.isArray(parsed)) throw new Error("Invalid format: Expected an array of workflows.");
        
        let count = 0;
        for (const item of parsed) {
          if (item.name && item.nodes && Array.isArray(item.nodes)) {
            await saveWorkflow({
              name: item.name,
              description: item.description || '',
              nodes: item.nodes,
              startingNodeId: item.startingNodeId || (item.nodes.length > 0 ? item.nodes[0].id : null)
            });
            count++;
          }
        }
        
        if (count > 0) {
          toast.success(`Successfully imported ${count} workflows!`);
        } else {
          toast.error('No valid workflows found in the file.');
        }
      } catch (err) {
        console.error('Import error:', err);
        toast.error('Failed to import workflows. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Workflows');

      worksheet.columns = [
        { header: 'Workflow Name', key: 'workflowName', width: 25 },
        { header: 'Workflow Description', key: 'workflowDesc', width: 30 },
        { header: 'Step ID', key: 'stepId', width: 10 },
        { header: 'Step Title', key: 'stepTitle', width: 25 },
        { header: 'Step Content', key: 'stepContent', width: 35 },
        { header: 'Step Type', key: 'stepType', width: 15 },
        { header: 'Option 1 Label', key: 'opt1Label', width: 20 },
        { header: 'Option 1 Next Step ID', key: 'opt1Next', width: 20 },
        { header: 'Option 2 Label', key: 'opt2Label', width: 20 },
        { header: 'Option 2 Next Step ID', key: 'opt2Next', width: 20 },
        { header: 'Option 3 Label', key: 'opt3Label', width: 20 },
        { header: 'Option 3 Next Step ID', key: 'opt3Next', width: 20 },
        { header: 'Option 4 Label', key: 'opt4Label', width: 20 },
        { header: 'Option 4 Next Step ID', key: 'opt4Next', width: 20 },
      ];

      workflows.forEach(wf => {
        const idMap = new Map<string, number>();
        wf.nodes.forEach((node, index) => idMap.set(node.id, index + 1));

        wf.nodes.forEach(node => {
          const row: any = {
            workflowName: wf.name,
            workflowDesc: wf.description,
            stepId: idMap.get(node.id),
            stepTitle: node.title,
            stepContent: node.content,
            stepType: node.type,
          };

          node.options.forEach((opt, idx) => {
            if (idx < 4) {
              row[`opt${idx + 1}Label`] = opt.label;
              row[`opt${idx + 1}Next`] = opt.nextNodeId ? idMap.get(opt.nextNodeId) : '';
            }
          });

          worksheet.addRow(row);
        });
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflows_template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Excel template exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export Excel file.');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) throw new Error("No worksheet found");

      const workflowsMap = new Map<string, any[]>();
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const wfName = row.getCell(1).text?.trim();
        if (!wfName) return;

        if (!workflowsMap.has(wfName)) {
          workflowsMap.set(wfName, []);
        }
        workflowsMap.get(wfName)!.push(row);
      });

      let importCount = 0;

      for (const [wfName, rows] of workflowsMap.entries()) {
        const wfDesc = rows[0].getCell(2).text?.trim() || '';
        
        const localIdToUuid = new Map<string, string>();
        const nodes: WorkflowNode[] = [];
        
        // Pass 1: Map local IDs to UUIDs
        rows.forEach(row => {
          const stepId = row.getCell(3).text?.trim();
          if (stepId) {
            localIdToUuid.set(stepId, crypto.randomUUID());
          }
        });

        // Pass 2: Build nodes
        rows.forEach(row => {
          const stepId = row.getCell(3).text?.trim();
          if (!stepId) return;

          const uuid = localIdToUuid.get(stepId);
          if (!uuid) return;

          const typeText = row.getCell(6).text?.trim().toLowerCase();
          const type = typeText === 'resolution' ? 'resolution' : 'question';

          const options: WorkflowOption[] = [];
          for (let i = 1; i <= 4; i++) {
            const optLabel = row.getCell(6 + (i * 2) - 1).text?.trim();
            const optNext = row.getCell(6 + (i * 2)).text?.trim();
            
            if (optLabel) {
              options.push({
                id: crypto.randomUUID(),
                label: optLabel,
                nextNodeId: optNext ? (localIdToUuid.get(optNext) || null) : null
              });
            }
          }

          nodes.push({
            id: uuid,
            title: row.getCell(4).text?.trim() || 'Untitled Step',
            content: row.getCell(5).text?.trim() || '',
            type,
            options
          });
        });

        if (nodes.length > 0) {
          await saveWorkflow({
            name: wfName,
            description: wfDesc,
            nodes,
            startingNodeId: nodes[0].id
          });
          importCount++;
        }
      }

      if (importCount > 0) {
        toast.success(`Successfully imported ${importCount} workflows from Excel!`);
      } else {
        toast.error('No valid workflows found in the Excel file.');
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to parse Excel file. Please ensure it matches the template format.');
    }
    
    e.target.value = '';
  };

  if (view === 'building') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">
              {activeWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            </h2>
          </div>
          <Button onClick={handleSaveWorkflow} leftIcon={<Save className="w-4 h-4" />}>
            Save Workflow
          </Button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <Input
            label="Workflow Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g., Refund Process"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y h-20"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="What is this workflow for?"
            />
          </div>
          
          {editNodes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Starting Step</label>
              <select
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={editStartingNodeId || ''}
                onChange={(e) => setEditStartingNodeId(e.target.value)}
              >
                <option value="" disabled>Select starting step</option>
                {editNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Steps</h3>
            <Button onClick={addNode} variant="outline" leftIcon={<Plus className="w-4 h-4" />}>
              Add Step
            </Button>
          </div>

          <AnimatePresence>
            {editNodes.map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white p-5 rounded-xl shadow-sm border ${editStartingNodeId === node.id ? 'border-indigo-300 ring-1 ring-indigo-300' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">Step {index + 1}</span>
                      {editStartingNodeId === node.id && (
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">Start</span>
                      )}
                    </div>
                    <Input
                      label="Step Title"
                      value={node.title}
                      onChange={(e) => updateNode(node.id, { title: e.target.value })}
                      placeholder="e.g., Is the item damaged?"
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Instructions / Content</label>
                      <textarea
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y h-24"
                        value={node.content}
                        onChange={(e) => updateNode(node.id, { content: e.target.value })}
                        placeholder="What should the agent say or do here?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Step Type</label>
                      <select
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={node.type}
                        onChange={(e) => updateNode(node.id, { type: e.target.value as 'question' | 'resolution' })}
                      >
                        <option value="question">Question / Decision (Has Options)</option>
                        <option value="resolution">Resolution (End of Workflow)</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => removeNode(node.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {node.type === 'question' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-700">Options</h4>
                      <Button onClick={() => addOption(node.id)} variant="ghost" className="text-xs h-8">
                        <Plus className="w-3 h-3 mr-1" /> Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {node.options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <input
                            type="text"
                            className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500"
                            value={option.label}
                            onChange={(e) => updateOption(node.id, option.id, { label: e.target.value })}
                            placeholder="Option label (e.g., Yes)"
                          />
                          <span className="text-slate-400 text-sm">→</span>
                          <select
                            className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500"
                            value={option.nextNodeId || ''}
                            onChange={(e) => updateOption(node.id, option.id, { nextNodeId: e.target.value || null })}
                          >
                            <option value="">Select next step...</option>
                            {editNodes.filter(n => n.id !== node.id).map(n => (
                              <option key={n.id} value={n.id}>{n.title}</option>
                            ))}
                          </select>
                          <button onClick={() => removeOption(node.id, option.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {node.options.length === 0 && (
                        <p className="text-sm text-slate-500 italic text-center py-2">No options added yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {editNodes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <Waypoints className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No steps yet</h3>
              <p className="text-slate-500 mt-1 mb-4">Add your first step to start building the workflow.</p>
              <Button onClick={addNode} leftIcon={<Plus className="w-4 h-4" />}>Add First Step</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'playing' && activeWorkflow) {
    const currentNode = activeWorkflow.nodes.find(n => n.id === currentNodeId);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{activeWorkflow.name}</h2>
              <p className="text-sm text-slate-500">Step {history.length + 1}</p>
            </div>
          </div>
          {history.length > 0 && (
            <Button onClick={handleBack} variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Go Back
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {currentNode ? (
            <motion.div
              key={currentNode.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-xl shadow-sm border border-slate-200"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-4">{currentNode.title}</h3>
              
              {currentNode.content && (
                <div className="prose prose-slate max-w-none mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentNode.content.replace(/\n/g, '<br/>')) }} />
                </div>
              )}

              {currentNode.type === 'question' ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Choose an option:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentNode.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionClick(option.nextNodeId)}
                        className="p-4 text-left bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl transition-all font-medium text-slate-700 hover:text-indigo-700 shadow-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {currentNode.options.length === 0 && (
                    <p className="text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">This step has no options configured. Please edit the workflow.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">Resolution Reached</span>
                  </div>
                  <div className="flex gap-3">
                    {currentNode.content && (
                      <Button onClick={() => copyResolution(currentNode.content)} className="flex-1" leftIcon={<Copy className="w-4 h-4" />}>
                        Copy Resolution
                      </Button>
                    )}
                    <Button onClick={() => startPlaying(activeWorkflow)} variant="outline" className="flex-1" leftIcon={<Waypoints className="w-4 h-4" />}>
                      Restart Workflow
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500">Step not found. The workflow might be misconfigured.</p>
              <Button onClick={() => setView('list')} className="mt-4">Return to List</Button>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // List View
  useEffect(() => {
    const onReset = () => {
      setSearchQuery('');
      setEditName('');
      setEditDescription('');
      setEditNodes([]);
      setEditStartingNodeId(null);
      setHistory([]);
      setCurrentNodeId(null);
    };
    const onCancel = () => {
      setView('list');
      setActiveWorkflow(null);
      onReset();
    };
    window.addEventListener('reset-workflows', onReset);
    window.addEventListener('cancel-workflows', onCancel);
    return () => {
      window.removeEventListener('reset-workflows', onReset);
      window.removeEventListener('cancel-workflows', onCancel);
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ticket Maker & Workflows</h2>
          <p className="text-slate-500 mt-1">Interactive step-by-step guides for customer scenarios.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={exportMenuRef}>
            <Button 
              variant="outline" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export / Import
            </Button>
            
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-2">
                    <button
                      onClick={() => {
                        handleExportJSON();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">Export as JSON</div>
                        <div className="text-xs text-slate-500">Backup workflows</div>
                      </div>
                    </button>
                    <label className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer mt-1">
                      <Upload className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">Import JSON</div>
                        <div className="text-xs text-slate-500">Restore workflows</div>
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          handleImportJSON(e);
                          setShowExportMenu(false);
                        }}
                      />
                    </label>
                    
                    <div className="h-px bg-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        handleExportExcel();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div className="text-left">
                        <div className="font-medium">Export to Excel</div>
                        <div className="text-xs text-slate-500">Download template</div>
                      </div>
                    </button>
                    <label className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer mt-1">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <div className="text-left">
                        <div className="font-medium">Import Excel</div>
                        <div className="text-xs text-slate-500">Bulk create from template</div>
                      </div>
                      <input
                        type="file"
                        accept=".xlsx"
                        className="hidden"
                        onChange={(e) => {
                          handleImportExcel(e);
                          setShowExportMenu(false);
                        }}
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button onClick={() => startBuilding()} leftIcon={<Plus className="w-5 h-5" />}>
            Create Workflow
          </Button>
        </div>
      </div>

      <div className="relative">
        <Input
          leftIcon={<Search className="w-5 h-5" />}
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredWorkflows.map(workflow => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{workflow.name}</h3>
                  <button 
                    onClick={() => toggleFavoriteWorkflow(workflow.id, !!workflow.isFavorite)}
                    className="p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <Star className={`w-5 h-5 ${workflow.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
                  </button>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                  {workflow.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Waypoints className="w-4 h-4" />
                  <span>{workflow.nodes.length} Steps</span>
                </div>
              </div>
              <div className="bg-slate-50 border-t border-slate-100 p-3 flex items-center justify-between">
                <Button onClick={() => startPlaying(workflow)} className="flex-1 mr-2" leftIcon={<Play className="w-4 h-4" />}>
                  Start
                </Button>
                <div className="flex gap-1">
                  <button onClick={() => startBuilding(workflow)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteWorkflow(workflow.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Waypoints className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900">No workflows found</h3>
          <p className="text-slate-500 mt-2 mb-6 max-w-md mx-auto">
            {searchQuery ? 'Try adjusting your search terms.' : 'Create your first interactive workflow to guide agents through complex scenarios.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => startBuilding()} leftIcon={<Plus className="w-5 h-5" />}>
              Create Workflow
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {workflowToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 text-center mb-2">Delete Workflow?</h3>
                <p className="text-slate-500 text-center mb-6">
                  Are you sure you want to delete this workflow? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setWorkflowToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={confirmDeleteWorkflow}
                  >
                    Delete Workflow
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
