import jsonc from "eslint-plugin-jsonc";

// A dummy parser that returns an empty AST.
// This prevents ESLint from failing to parse TypeScript syntax (or complaining about missing parsers),
// while effectively silencing "no matching configuration" warnings for these files.
const dummyParser = {
  meta: { name: "dummy-parser" },
  parseForESLint: (text) => ({
    ast: {
      type: "Program",
      start: 0,
      end: text.length,
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
      range: [0, text.length],
      body: [],
      tokens: [],
      comments: [],
    },
    services: {},
    visitorKeys: {},
    scopeManager: null,
  }),
};

export default [
  // Global ignores for build artifacts and dependencies
  {
    ignores: ["**/node_modules/**", ".expo/**", "dist/**", "web-build/**"],
  },

  // 1. Specific configuration for data/meds.json
  {
    files: ["data/meds.json"],
    plugins: {
      jsonc,
    },
    languageOptions: {
      parser: jsonc,
    },
    rules: {
      "jsonc/sort-keys": [
        "error",
        {
          pathPattern: "^medications$",
          order: { type: "asc", natural: true },
        },
      ],
    },
  },

  // 2. Catch-all configuration for all other JSON files
  // This ensures they are "configured" (suppressing warnings) but not linted with strict rules.
  {
    files: ["**/*.json"],
    ignores: ["data/meds.json"], // Exclude the file handled above
    plugins: {
      jsonc,
    },
    languageOptions: {
      parser: jsonc,
    },
    rules: {},
  },

  // 3. Dummy configuration for JS/TS/MJS files
  // This ensures they are matched by a configuration (suppressing warnings)
  // but parsed by our dummy parser so we don't need to install TypeScript dependencies right now.
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx", "**/*.mjs"],
    languageOptions: {
      parser: dummyParser,
    },
    rules: {},
  },
];