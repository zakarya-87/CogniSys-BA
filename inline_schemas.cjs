const fs = require('fs');
const generatedSchemas = JSON.parse(fs.readFileSync('generated_schemas.json', 'utf8'));

function inlineRefs(schema, definitions, seen = new Set()) {
    if (!schema || typeof schema !== 'object') return schema;

    if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        if (seen.has(refName)) {
            // Recursive ref, keep it
            return schema;
        }
        const refSchema = definitions[refName];
        if (!refSchema) {
            console.warn(`Missing definition for ${refName}`);
            return schema;
        }
        // Inline the ref
        const newSeen = new Set(seen);
        newSeen.add(refName);
        return inlineRefs(JSON.parse(JSON.stringify(refSchema)), definitions, newSeen);
    }

    if (Array.isArray(schema)) {
        return schema.map(item => inlineRefs(item, definitions, seen));
    }

    const newSchema = {};
    for (const [key, value] of Object.entries(schema)) {
        newSchema[key] = inlineRefs(value, definitions, seen);
    }
    return newSchema;
}

const fixedSchemas = {};
for (const [name, schema] of Object.entries(generatedSchemas)) {
    const definitions = schema.definitions || {};
    // We also want to be able to resolve references to other top-level symbols
    // so we merge the top-level mapping into the definitions.
    const allDefinitions = { ...definitions, ...generatedSchemas };
    fixedSchemas[name] = inlineRefs(schema, allDefinitions);
    delete fixedSchemas[name].definitions;
}

fs.writeFileSync('generated_schemas.json', JSON.stringify(fixedSchemas, null, 2));
console.log('Inlined non-recursive $refs in generated_schemas.json');
