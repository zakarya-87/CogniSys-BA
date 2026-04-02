const fs = require('fs');

const file = fs.readFileSync('./components/InitiativeView.tsx', 'utf-8');

const lines = file.split('\n');
const newLines = [];
let inImports = false;

for (let line of lines) {
    const match = line.match(/^import { ([a-zA-Z0-9_]+) } from '\.\/ai\/([a-zA-Z0-9_]+)';/);
    if (match) {
        const componentName = match[1];
        const fileName = match[2];
        newLines.push(`const ${componentName} = React.lazy(() => import('./ai/${fileName}').then(m => ({ default: m.${componentName} })));`);
    } else {
        newLines.push(line);
    }
}

fs.writeFileSync('./components/InitiativeView.tsx', newLines.join('\n'));
