/**
 * @fileoverview `ui/script-setup-order` — sections of `<script setup>` in order.
 *
 * Order: imports, macros, composables, state, computed, watchers, functions,
 * lifecycle hooks. Each top-level statement is classified by its callee:
 * `define*` (macros), `use*` (composables), `ref` / `shallowRef` / `reactive`
 * (state), `computed`, `watch*`, a function declaration or a function-valued
 * const, `on*` (lifecycle). A statement that comes after a later section is
 * flagged. Statements that fit no section (constants, types) are ignored.
 *
 * Valid:   `const props = defineProps<P>(); const n = ref(0); const d = computed(() => n.value);`
 * Invalid: `const n = ref(0); const props = defineProps<P>();`
 *
 * @module packages/eslint-plugin-ui/rules/script-setup-order
 */

const SECTIONS = [
  "macros",
  "composables",
  "state",
  "computed",
  "watchers",
  "functions",
  "lifecycle hooks"
];

const MACROS = new Set([
  "defineOptions",
  "defineModel",
  "defineProps",
  "defineEmits",
  "defineSlots",
  "withDefaults"
]);
const STATE = new Set([
  "ref",
  "shallowRef",
  "reactive",
  "shallowReactive",
  "customRef"
]);
const WATCHERS = new Set([
  "watch",
  "watchEffect",
  "watchPostEffect",
  "watchSyncEffect"
]);

/** The callee name of a call expression, or null. */
function calleeName(node) {
  if (node?.type !== "CallExpression") return null;
  return node.callee.type === "Identifier" ? node.callee.name : null;
}

/** Strip `await`, `as` and `!` wrappers from an initializer. */
function unwrap(node) {
  let current = node;
  while (
    current &&
    (current.type === "AwaitExpression" ||
      current.type === "TSAsExpression" ||
      current.type === "TSNonNullExpression")
  ) {
    current = current.argument ?? current.expression;
  }
  return current;
}

/** The section index of a top-level statement, or -1 when it has none. */
function classify(statement) {
  if (statement.type === "FunctionDeclaration") return 5;
  let expression = null;
  if (statement.type === "VariableDeclaration") {
    const init = unwrap(statement.declarations[0]?.init);
    if (
      init?.type === "ArrowFunctionExpression" ||
      init?.type === "FunctionExpression"
    ) {
      return 5;
    }
    expression = init;
  } else if (statement.type === "ExpressionStatement") {
    expression = unwrap(statement.expression);
  }
  const name = calleeName(expression);
  if (!name) return -1;
  if (MACROS.has(name)) return 0;
  if (name === "computed") return 3;
  if (STATE.has(name)) return 2;
  if (WATCHERS.has(name)) return 4;
  if (/^use[A-Z0-9]/.test(name)) return 1;
  if (/^on[A-Z]/.test(name)) return 6;
  return -1;
}

/** True when the SFC has a `<script setup>` block. */
function hasScriptSetup(sourceCode) {
  const fragment = sourceCode.parserServices?.getDocumentFragment?.();
  if (!fragment) return false;
  return fragment.children.some(
    child =>
      child.type === "VElement" &&
      child.name === "script" &&
      child.startTag.attributes.some(
        attribute => !attribute.directive && attribute.key.name === "setup"
      )
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require script-setup sections in order: macros, composables, state, computed, watchers, functions, lifecycle hooks.",
      recommended: true
    },
    schema: [],
    messages: {
      outOfOrder:
        "This {{section}} statement comes after {{later}}. Order `<script setup>` as: imports, macros, composables, state, computed, watchers, functions, lifecycle hooks."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode;
    if (!hasScriptSetup(sourceCode)) return {};
    return {
      Program(program) {
        let furthest = -1;
        for (const statement of program.body) {
          const section = classify(statement);
          if (section === -1) continue;
          if (section < furthest) {
            context.report({
              node: statement,
              messageId: "outOfOrder",
              data: { section: SECTIONS[section], later: SECTIONS[furthest] }
            });
          } else {
            furthest = section;
          }
        }
      }
    };
  }
};
