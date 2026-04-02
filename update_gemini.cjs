const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Replace generateJson<T[]>(prompt) with generateJson<T[]>(prompt, { type: 'array', items: generatedSchemas['T'] }, [])
const regexArray = /generateJson<([A-Za-z0-9_]+)\[\]>\(([^,]+?)\)/g;
content = content.replace(regexArray, (match, typeName, promptArg) => {
    return `generateJson<${typeName}[]>(${promptArg}, { type: 'array', items: generatedSchemas['${typeName}'] }, [])`;
});

fs.writeFileSync('services/geminiService.ts', content, 'utf8');
console.log("Updated geminiService.ts for arrays");
