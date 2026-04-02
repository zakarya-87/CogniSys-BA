// Type declaration for the generated JSON schema file.
// This file is generated at build time by generate_all_schemas.cjs and is gitignored.
// Run `node generate_all_schemas.cjs` to generate it before building.
declare module '*/generated_schemas.json' {
  const schemas: Record<string, {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
    items?: unknown;
    enum?: unknown[];
    [key: string]: unknown;
  }>;
  export default schemas;
}
