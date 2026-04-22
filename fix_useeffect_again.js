import fs from 'fs';

const tabs = [
  'src/components/DraftTab.tsx',
  'src/components/MacrosTab.tsx',
  'src/components/TemplatesTab.tsx',
  'src/components/WorkflowsTab.tsx',
  'src/components/UpdatesTab.tsx',
  'src/components/TranslatorTab.tsx',
  'src/components/SpeechToTextTab.tsx',
  'src/components/GrammarCheckTab.tsx',
  'src/components/AskCaptainTab.tsx',
  'src/components/TollGatesTab.tsx',
  'src/components/CalculatorTab.tsx',
  'src/components/LinksTab.tsx'
];

for (const file of tabs) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Extract the useEffect block we injected
  const match = content.match(/  useEffect\(\(\) => \{\n    const onReset = \(\) => \{[\s\S]*?  \}, \[.*?\]\);\n/);
  if (match) {
    const useEffectBlock = match[0];
    // Remove it from its current position
    content = content.replace(useEffectBlock, '');
    
    // Find the actual main return statement.
    // The main return statement is usually `  return (` followed by a newline and `<div` or similar.
    // Or we can just find the last `  return (` in the file.
    let lastReturnIndex = -1;
    let currentIndex = content.indexOf('  return (');
    while (currentIndex !== -1) {
      lastReturnIndex = currentIndex;
      currentIndex = content.indexOf('  return (', currentIndex + 1);
    }
    
    if (lastReturnIndex !== -1) {
      content = content.slice(0, lastReturnIndex) + useEffectBlock + content.slice(lastReturnIndex);
      fs.writeFileSync(file, content);
      console.log('Fixed ' + file);
    } else {
      console.log('Could not find return in ' + file);
    }
  } else {
    console.log('Could not find useEffect block in ' + file);
  }
}
