import type { GeneratedFile, GeneratorContext } from '@synap-js/core';
import { generatedHeader } from '../utils/naming.js';

export function generateAppEntry(context: GeneratorContext): GeneratedFile[] {
  const dir = `${context.outputDir}/ui`;
  const header = generatedHeader('synap:ui');
  const files: GeneratedFile[] = [];

  files.push({
    path: `${dir}/index.html`,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Synap App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
`,
  });

  files.push({
    path: `${dir}/main.tsx`,
    content: `${header}
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  });

  files.push({
    path: `${dir}/app.tsx`,
    content: `${header}
import React from 'react';
import { Router } from './router.js';

export function App() {
  return <Router />;
}
`,
  });

  return files;
}
