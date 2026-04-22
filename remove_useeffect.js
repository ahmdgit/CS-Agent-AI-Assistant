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
  
  const match = content.match(/  useEffect\(\(\) => \{\n    const onReset = \(\) => \{[\s\S]*?  \}, \[.*?\]\);\n/);
  if (match) {
    content = content.replace(match[0], '');
    fs.writeFileSync(file, content);
    console.log('Removed from ' + file);
  }
}
