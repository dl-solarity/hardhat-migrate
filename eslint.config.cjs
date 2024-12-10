const js = require("@eslint/js");

const typescript = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  js.configs.recommended,
  {
    ignores: ["dist/*.js", "*.md", "test/fixture-projects/**/*.*"],
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      "arrow-parens": "off",
      "no-debugger": "warn",
      "no-undef": "off",
      "no-unused-var": "off",
      "no-unused-vars": "off",
      "no-warning-comments": [
        "warn",
        {
          terms: ["hardcoded"],
          location: "anywhere",
        },
      ],
      "no-return-await": "warn",
      "object-curly-spacing": ["error", "always"],
      "no-var": "error",
      "comma-dangle": ["warn", "always-multiline"],
      "linebreak-style": ["error", "unix"],
      "generator-star-spacing": "off",
      "no-tabs": "error",
      "max-len": [
        "warn",
        {
          code: 120,
          comments: 120,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0, maxBOF: 0 }],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];
