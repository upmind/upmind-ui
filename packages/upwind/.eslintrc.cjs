/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-typescript",
    "@vue/eslint-config-prettier/skip-formatting",
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  globals: {
    // process: true,
    // grecaptcha: true
  },
  // custom rules here
  rules: {
    "prefer-promise-reject-errors": "off",

    // development only
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-constant-condition":
      process.env.NODE_ENV === "production" ? "error" : "off",

    // unused
    // note you must disable the base rule
    // as it can report incorrect errors
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn", // or "error"
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],

    // typecript
    "@typescript-eslint/no-var-requires": "off", // we have a vite plugin that resolves this
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-this-alias": [
      "error",
      {
        allowDestructuring: true, // Allow `const { props, state } = this`; false by default
        allowedNames: ["vm"], // Allow `const vm= this`; `[]` by default
      },
    ],

    // vue
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/multi-word-component-names": "off",
    "vue/no-reserved-component-names": "off",
    "vue/no-v-html": "off",
    "vue/no-v-text-v-html-on-component": "off",
    "vue/no-v-model-argument": "off",
    // "vue/component-api-style": [
    //   "error",
    //   ["script-setup", "composition", "options"],
    // ], // "script-setup", "composition", "composition-vue2", or "options"

    // general
    "no-unsafe-optional-chaining": "off",
  },
};
