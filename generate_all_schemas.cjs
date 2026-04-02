const fs = require('fs');
const path = require('path');
const TJS = require('typescript-json-schema');

const settings = {
    required: true,
    ref: true,
    topRef: false,
    noExtraProps: true,
};

const compilerOptions = {
    strictNullChecks: true,
    esModuleInterop: true,
    target: 'esnext',
    module: 'esnext',
    moduleResolution: 'node',
};

const program = TJS.getProgramFromFiles([path.resolve('types.ts')], compilerOptions);
const generator = TJS.buildGenerator(program, settings);

if (!generator) {
    console.error('Failed to build generator');
    process.exit(1);
}

// Get all symbols
const allSymbols = generator.getUserSymbols();
const targetSymbols = allSymbols.filter(symbol => 
    symbol.startsWith('T') || symbol.endsWith('Analysis') || symbol.endsWith('Result')
);

console.log(`Generating schemas for ${targetSymbols.length} target symbols...`);

const schemas = {};
const allDefinitions = {};

for (const symbol of targetSymbols) {
    try {
        const schema = generator.getSchemaForSymbol(symbol);
        if (schema.definitions) {
            Object.assign(allDefinitions, schema.definitions);
            delete schema.definitions; // We'll keep them in allDefinitions
        }
        schemas[symbol] = schema;
    } catch (e) {
        console.warn(`Could not generate schema for ${symbol}: ${e.message}`);
    }
}

// Add all collected definitions to each schema
for (const symbol of Object.keys(schemas)) {
    schemas[symbol].definitions = allDefinitions;
}

fs.writeFileSync('generated_schemas.json', JSON.stringify(schemas, null, 2));
console.log(`Generated ${Object.keys(schemas).length} schemas in generated_schemas.json`);
