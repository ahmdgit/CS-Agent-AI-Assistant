import fs from 'fs';

const files = [
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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Extract the useEffect block we injected
  const match = content.match(/  useEffect\(\(\) => \{\n    const onReset = \(\) => \{[\s\S]*?  \}, \[.*?\]\);\n/);
  if (match) {
    const useEffectBlock = match[0];
    // Remove it from its current position
    content = content.replace(useEffectBlock, '');
    
    // Find the last return statement of the component
    // A simple heuristic: find the first "return (" that is not indented too much, or just find the first "return (" after all useStates.
    // Actually, finding "  return (" is usually safe for the main component return.
    const returnMatch = content.match(/^  return \(/m);
    if (returnMatch) {
      const index = content.indexOf(returnMatch[0]);
      content = content.slice(0, index) + useEffectBlock + '\n' + content.slice(index);
      fs.writeFileSync(file, content);
      console.log('Fixed ' + file);
    } else {
      console.log('Could not find return in ' + file);
    }
  } else {
    console.log('Could not find useEffect block in ' + file);
  }
}
