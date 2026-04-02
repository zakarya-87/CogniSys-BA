const fs = require('fs');
const generatedSchemas = JSON.parse(fs.readFileSync('generated_schemas.json', 'utf8'));
const geminiService = fs.readFileSync('services/geminiService.ts', 'utf8');

const schemaRegex = /generatedSchemas\['(\w+)'\]/g;
let match;
const missingSchemas = [];
const foundSchemas = new Set();

while ((match = schemaRegex.exec(geminiService)) !== null) {
    const schemaName = match[1];
    foundSchemas.add(schemaName);
    if (!generatedSchemas[schemaName]) {
        missingSchemas.push(schemaName);
    }
}

console.log('Found schemas:', Array.from(foundSchemas).sort());
console.log('Missing schemas:', missingSchemas);

if (missingSchemas.length > 0) {
    process.exit(1);
}
