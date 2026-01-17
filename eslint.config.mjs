import jsonc from "eslint-plugin-jsonc";

export default [
  // Ignore all JSON files except meds.json
  {
    ignores: ["**/*.json", "!data/meds.json"],
  },
  // JSON files configuration
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
];
