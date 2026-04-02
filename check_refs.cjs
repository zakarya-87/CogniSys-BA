const fs = require('fs');
const generatedSchemas = JSON.parse(fs.readFileSync('generated_schemas.json', 'utf8'));

const schemasWithRefs = [];
for (const [name, schema] of Object.entries(generatedSchemas)) {
    if (JSON.stringify(schema).includes('$ref')) {
        schemasWithRefs.push(name);
    }
}

console.log('Schemas with $refs:', schemasWithRefs);
