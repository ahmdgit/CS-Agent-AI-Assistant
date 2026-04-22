import fs from 'fs';

const tabs = [
  {
    file: 'src/components/DraftTab.tsx',
    id: 'draft',
    code: `
  useEffect(() => {
    const onReset = () => handleReset();
    const onCancel = () => handleReset();
    window.addEventListener('reset-draft', onReset);
    window.addEventListener('cancel-draft', onCancel);
    return () => {
      window.removeEventListener('reset-draft', onReset);
      window.removeEventListener('cancel-draft', onCancel);
    };
  }, []);
`
  },
  {
    file: 'src/components/MacrosTab.tsx',
    id: 'macros',
    code: `
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
`
  },
  {
    file: 'src/components/TemplatesTab.tsx',
    id: 'templates',
    code: `
  useEffect(() => {
    const onReset = () => {
      setEditName('');
      setEditFields([]);
    };
    const onCancel = () => {
      setIsEditing(false);
      setEditTemplateId(null);
      onReset();
    };
    window.addEventListener('reset-templates', onReset);
    window.addEventListener('cancel-templates', onCancel);
    return () => {
      window.removeEventListener('reset-templates', onReset);
      window.removeEventListener('cancel-templates', onCancel);
    };
  }, []);
`
  },
  {
    file: 'src/components/WorkflowsTab.tsx',
    id: 'workflows',
    code: `
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
`
  },
  {
    file: 'src/components/UpdatesTab.tsx',
    id: 'updates',
    code: `
  useEffect(() => {
    const onReset = () => {
      setSearchQuery('');
      setEditTitle('');
      setEditContent('');
      setEditSeverity('Medium');
      setEditLink('');
      setEditImageUrl('');
      setNewTitle('');
      setNewContent('');
      setNewSeverity('Medium');
      setNewLink('');
      setNewImageUrl('');
    };
    const onCancel = () => {
      setEditingId(null);
      setIsCreating(false);
      onReset();
    };
    window.addEventListener('reset-updates', onReset);
    window.addEventListener('cancel-updates', onCancel);
    return () => {
      window.removeEventListener('reset-updates', onReset);
      window.removeEventListener('cancel-updates', onCancel);
    };
  }, []);
`
  },
  {
    file: 'src/components/TranslatorTab.tsx',
    id: 'translator',
    code: `
  useEffect(() => {
    const onReset = () => handleReset();
    const onCancel = () => handleReset();
    window.addEventListener('reset-translator', onReset);
    window.addEventListener('cancel-translator', onCancel);
    return () => {
      window.removeEventListener('reset-translator', onReset);
      window.removeEventListener('cancel-translator', onCancel);
    };
  }, []);
`
  },
  {
    file: 'src/components/SpeechToTextTab.tsx',
    id: 'speechToText',
    code: `
  useEffect(() => {
    const onReset = () => {
      setAudioFiles([]);
    };
    const onCancel = () => {
      setAudioFiles([]);
    };
    window.addEventListener('reset-speechToText', onReset);
    window.addEventListener('cancel-speechToText', onCancel);
    return () => {
      window.removeEventListener('reset-speechToText', onReset);
      window.removeEventListener('cancel-speechToText', onCancel);
    };
  }, []);
`
  },
  {
    file: 'src/components/GrammarCheckTab.tsx',
    id: 'grammar',
    code: `
  useEffect(() => {
    const onReset = () => handleReset();
    const onCancel = () => handleReset();
    window.addEventListener('reset-grammar', onReset);
    window.addEventListener('cancel-grammar', onCancel);
    return () => {
      window.removeEventListener('reset-grammar', onReset);
      window.removeEventListener('cancel-grammar', onCancel);
    };
  }, []);
`
  },
  {
    file: 'src/components/AskCaptainTab.tsx',
    id: 'askCaptain',
    code: `
  useEffect(() => {
    const onReset = () => handleReset();
    const onCancel = () => handleReset();
    window.addEventListener('reset-askCaptain', onReset);
    window.addEventListener('cancel-askCaptain', onCancel);
    return () => {
      window.removeEventListener('reset-askCaptain', onReset);
      window.removeEventListener('cancel-askCaptain', onCancel);
    };
  }, []);
`
  },
  {
    file: 'src/components/TollGatesTab.tsx',
    id: 'tollGates',
    code: `
  useEffect(() => {
    const onReset = () => {
      setPickup('');
      setDropoff('');
      setTime('');
      setResult('');
    };
    const onCancel = () => {
      setPickup('');
      setDropoff('');
      setTime('');
      setResult('');
    };
    window.addEventListener('reset-tollGates', onReset);
    window.addEventListener('cancel-tollGates', onCancel);
    return () => {
      window.removeEventListener('reset-tollGates', onReset);
      window.removeEventListener('cancel-tollGates', onCancel);
    };
  }, []);
`
  },
  {
    file: 'src/components/CalculatorTab.tsx',
    id: 'calculator',
    code: `
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
`
  },
  {
    file: 'src/components/LinksTab.tsx',
    id: 'links',
    code: `
  useEffect(() => {
    const onReset = () => {
      setSearchQuery('');
      setEditUrl('');
      setEditDescription('');
      setNewUrl('');
      setNewDescription('');
    };
    const onCancel = () => {
      setEditingId(null);
      setIsCreating(false);
      onReset();
    };
    window.addEventListener('reset-links', onReset);
    window.addEventListener('cancel-links', onCancel);
    return () => {
      window.removeEventListener('reset-links', onReset);
      window.removeEventListener('cancel-links', onCancel);
    };
  }, []);
`
  }
];

for (const tab of tabs) {
  let content = fs.readFileSync(tab.file, 'utf8');

  // Find the first "  return ("
  const returnMatch = content.match(/^  return \(/m);
  if (returnMatch) {
    const index = content.indexOf(returnMatch[0]);
    content = content.slice(0, index) + tab.code + content.slice(index);
    fs.writeFileSync(tab.file, content);
    console.log('Injected into ' + tab.file);
  } else {
    console.log('Could not find return in ' + tab.file);
  }
}
