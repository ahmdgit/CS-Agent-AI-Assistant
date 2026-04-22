import fs from 'fs';

const tabs = [
  {
    file: 'src/components/DraftTab.tsx',
    id: 'draft',
    reset: `setSummaryInput(''); setDraftInput(''); setResult(null); setSummaryToSave(''); setIsSaved(false); setIsCopied(false);`,
    cancel: `setSummaryInput(''); setDraftInput(''); setResult(null); setSummaryToSave(''); setIsSaved(false); setIsCopied(false);`
  },
  {
    file: 'src/components/MacrosTab.tsx',
    id: 'macros',
    reset: `setSearchQuery(''); setEditTitle(''); setEditContent(''); setEditTags('');`,
    cancel: `setView('list'); setEditingId(null); setSearchQuery(''); setEditTitle(''); setEditContent(''); setEditTags('');`
  },
  {
    file: 'src/components/TemplatesTab.tsx',
    id: 'templates',
    reset: `setSearchQuery(''); setEditTitle(''); setEditContent(''); setEditCategory('');`,
    cancel: `setView('list'); setEditingId(null); setSearchQuery(''); setEditTitle(''); setEditContent(''); setEditCategory('');`
  },
  {
    file: 'src/components/WorkflowsTab.tsx',
    id: 'workflows',
    reset: `setSearchQuery(''); setEditName(''); setEditDescription(''); setEditNodes([]); setEditStartingNodeId(null); setHistory([]); setCurrentNodeId(null);`,
    cancel: `setView('list'); setActiveWorkflow(null); setSearchQuery(''); setEditName(''); setEditDescription(''); setEditNodes([]); setEditStartingNodeId(null); setHistory([]); setCurrentNodeId(null);`
  },
  {
    file: 'src/components/UpdatesTab.tsx',
    id: 'updates',
    reset: `setSearchQuery(''); setEditTitle(''); setEditContent(''); setEditType('Feature'); setEditDate(new Date().toISOString().split('T')[0]);`,
    cancel: `setView('list'); setEditingId(null); setSearchQuery(''); setEditTitle(''); setEditContent(''); setEditType('Feature'); setEditDate(new Date().toISOString().split('T')[0]);`
  },
  {
    file: 'src/components/TranslatorTab.tsx',
    id: 'translator',
    reset: `setInputText(''); setTranslatedText(''); setImage(null);`,
    cancel: `setInputText(''); setTranslatedText(''); setImage(null);`
  },
  {
    file: 'src/components/SpeechToTextTab.tsx',
    id: 'speechToText',
    reset: `setAudioBlob(null); setTranscript(''); if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); }`,
    cancel: `setAudioBlob(null); setTranscript(''); if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); }`,
    deps: `[isRecording]`
  },
  {
    file: 'src/components/GrammarCheckTab.tsx',
    id: 'grammar',
    reset: `setInputText(''); setResult(null);`,
    cancel: `setInputText(''); setResult(null);`
  },
  {
    file: 'src/components/AskCaptainTab.tsx',
    id: 'askCaptain',
    reset: `setInputText(''); setResult(null);`,
    cancel: `setInputText(''); setResult(null);`
  },
  {
    file: 'src/components/TollGatesTab.tsx',
    id: 'tollGates',
    reset: `setPickup(''); setDropoff(''); setTime(''); setResult('');`,
    cancel: `setPickup(''); setDropoff(''); setTime(''); setResult('');`
  },
  {
    file: 'src/components/CalculatorTab.tsx',
    id: 'calculator',
    reset: `setDisplay('0'); setEquation(''); setPreviousValue(null); setOperation(null); setWaitingForNewValue(false);`,
    cancel: `setDisplay('0'); setEquation(''); setPreviousValue(null); setOperation(null); setWaitingForNewValue(false);`
  },
  {
    file: 'src/components/LinksTab.tsx',
    id: 'links',
    reset: `setSearchQuery(''); setEditTitle(''); setEditUrl(''); setEditCategory('');`,
    cancel: `setView('list'); setEditingId(null); setSearchQuery(''); setEditTitle(''); setEditUrl(''); setEditCategory('');`
  }
];

for (const tab of tabs) {
  let content = fs.readFileSync(tab.file, 'utf8');
  
  // Ensure useEffect is imported
  if (!content.includes('useEffect')) {
    content = content.replace(/import React, { useState(.*?) } from 'react';/, "import React, { useState$1, useEffect } from 'react';");
    if (!content.includes('useEffect')) {
       content = content.replace(/import React(.*?)from 'react';/, "import React$1, { useEffect } from 'react';");
    }
  }

  const hookCode = `
  useEffect(() => {
    const onReset = () => {
      ${tab.reset}
    };
    const onCancel = () => {
      ${tab.cancel}
    };
    window.addEventListener('reset-${tab.id}', onReset);
    window.addEventListener('cancel-${tab.id}', onCancel);
    return () => {
      window.removeEventListener('reset-${tab.id}', onReset);
      window.removeEventListener('cancel-${tab.id}', onCancel);
    };
  }, ${tab.deps || '[]'});
`;

  // Find the first useState or similar hook to inject after
  const match = content.match(/const \[.*?\] = useState.*?;/);
  if (match) {
    const index = content.indexOf(match[0]) + match[0].length;
    content = content.slice(0, index) + '\\n' + hookCode + content.slice(index);
    fs.writeFileSync(tab.file, content);
    console.log('Injected into ' + tab.file);
  } else {
    console.log('Could not find injection point in ' + tab.file);
  }
}
