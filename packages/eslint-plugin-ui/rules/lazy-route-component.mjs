/**
 * @fileoverview `ui/lazy-route-component` — route components load lazily.
 *
 * In router config, a route's `component` must be `() => import(...)`. A
 * `component` that names a `.vue` file imported statically fails. Scope the
 * rule to router files in the config `files`.
 *
 * Valid:   `{ path: "/", component: () => import("./Home.vue") }`
 * Invalid: `import Home from "./Home.vue"; { path: "/", component: Home }`
 *
 * @module packages/eslint-plugin-ui/rules/lazy-route-component
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a route component to be a dynamic import, not a statically imported .vue file.",
      recommended: true
    },
    schema: [],
    messages: {
      eagerComponent:
        'Route component `{{name}}` is imported statically. Use `component: () => import("...")`.'
    }
  },

  create(context) {
    const staticVueImports = new Set();
    return {
      ImportDeclaration(node) {
        if (node.importKind === "type") return;
        if (typeof node.source.value !== "string") return;
        if (!node.source.value.endsWith(".vue")) return;
        for (const specifier of node.specifiers) {
          staticVueImports.add(specifier.local.name);
        }
      },
      Property(node) {
        if (node.computed) return;
        const key =
          node.key.type === "Identifier"
            ? node.key.name
            : node.key.type === "Literal"
              ? node.key.value
              : null;
        if (key !== "component") return;
        if (node.value.type !== "Identifier") return;
        if (staticVueImports.has(node.value.name)) {
          context.report({
            node: node.value,
            messageId: "eagerComponent",
            data: { name: node.value.name }
          });
        }
      }
    };
  }
};
