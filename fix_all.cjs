const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Generate schemas for all types in types.ts
console.log("Generating schemas...");
const typesFile = fs.readFileSync('types.ts', 'utf8');
const typeNames = [];
const regex = /export interface (T[A-Za-z0-9_]+)/g;
let match;
while ((match = regex.exec(typesFile)) !== null) {
    typeNames.push(match[1]);
}

const schemas = {};
for (const typeName of typeNames) {
    try {
        const output = execSync(`npx -y ts-json-schema-generator --path types.ts --type ${typeName}`, { encoding: 'utf8' });
        const schema = JSON.parse(output);
        // Clean up schema to match what geminiService expects, or just use it as is
        // Actually, geminiService uses @google/genai Type enum if we pass it to responseSchema.
        // But if we just pass it as a JSON string in the prompt, it works for all models!
        schemas[typeName] = schema.definitions[typeName];
    } catch (e) {
        console.error(`Failed to generate schema for ${typeName}`);
    }
}

fs.writeFileSync('generated_schemas.json', JSON.stringify(schemas, null, 2));
console.log("Schemas generated.");
