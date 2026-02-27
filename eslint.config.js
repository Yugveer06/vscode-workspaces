const { defineConfig } = require("eslint/config");
const raycastConfig = require("@raycast/eslint-config");
const importPlugin = require("eslint-plugin-import");

module.exports = defineConfig([
  ...raycastConfig,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "object", "type"],
          pathGroups: [
            { pattern: "react", group: "external" },
            { pattern: "@/*", group: "internal" },
            { pattern: "@types/**", group: "internal" },
            { pattern: "@constants/**", group: "internal" },
            { pattern: "@utils/**", group: "internal" },
            { pattern: "@services/**", group: "internal" },
            { pattern: "@components/**", group: "internal" },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
]);
