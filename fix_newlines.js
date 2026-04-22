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
  content = content.replace(/\\n\s*useEffect\(/g, '\n  useEffect(');
  fs.writeFileSync(file, content);
}
