const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components', 'ai');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Only process if it has alert("Failed to...") or alert("Simulation failed.")
    if (content.includes('alert("Failed') || content.includes("alert('Failed") || content.includes('alert("Simulation failed') || content.includes('alert("Test Failed')) {
        
        // 1. Add error state if not exists
        if (!content.includes('const [error, setError] = useState')) {
            // Find the first useState
            const useStateRegex = /const \[.*?, .*?\] = useState.*?;/;
            const match = content.match(useStateRegex);
            if (match) {
                content = content.replace(match[0], `${match[0]}\n    const [error, setError] = useState<string | null>(null);`);
            } else {
                // Find the component declaration
                const compRegex = /export const [A-Za-z0-9_]+: React\.FC<.*?> = \(\{.*?\}\) => \{/;
                const match2 = content.match(compRegex);
                if (match2) {
                    content = content.replace(match2[0], `${match2[0]}\n    const [error, setError] = useState<string | null>(null);`);
                }
            }
        }

        // 2. Replace alert("Failed...") with setError("Failed...")
        content = content.replace(/alert\((['"`])(Failed.*?)\1\);/g, 'setError($1$2$1);');
        content = content.replace(/alert\((['"`])(Simulation failed.*?)\1\);/g, 'setError($1$2$1);');
        content = content.replace(/alert\((['"`])(Test Failed.*?)\1\);/g, 'setError($1$2$1);');

        // 3. Add error display if not exists
        if (!content.includes('{error &&')) {
            // Find a good place to insert the error message. Usually after the header or before the main content.
            // Let's look for the first <div className="... space-y-..."> or similar
            const headerRegex = /<h2 className="text-2xl font-semibold.*?<\/h2>[\s\S]*?<\/div>/;
            const match3 = content.match(headerRegex);
            if (match3) {
                const errorUI = `\n            {error && (\n                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">\n                    <h3 className="font-bold mb-2">Error</h3>\n                    <p>{error}</p>\n                </div>\n            )}`;
                content = content.replace(match3[0], `${match3[0]}${errorUI}`);
            } else {
                // If no header div, just put it after the first <div className="...">
                const divRegex = /<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md.*?>/;
                const match4 = content.match(divRegex);
                if (match4) {
                    const errorUI = `\n            {error && (\n                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">\n                    <h3 className="font-bold mb-2">Error</h3>\n                    <p>{error}</p>\n                </div>\n            )}`;
                    content = content.replace(match4[0], `${match4[0]}${errorUI}`);
                }
            }
        }

        // 4. Clear error before generating
        // Find handleGenerate or similar
        const handleGenRegex = /setIsLoading\(true\);/g;
        content = content.replace(handleGenRegex, 'setError(null);\n        setIsLoading(true);');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
