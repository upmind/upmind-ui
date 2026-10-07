import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./script-setup-order.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

const setup = body => `<script setup lang="ts">${body}</script>`;

test("script-setup-order", () => {
  ruleTester.run("script-setup-order", rule, {
    valid: [
      {
        code: setup(`
import { ref, computed, watch, onMounted } from "vue";
const props = defineProps<P>();
const emit = defineEmits<E>();
const store = useStore();
const n = ref(0);
const d = computed(() => n.value);
watch(n, () => {});
function go() {}
const stop = () => {};
onMounted(() => {});
`)
      },
      {
        code: setup(`
const LIMIT = 3;
type Row = { id: string };
const props = defineProps<P>();
const n = ref(0);
`)
      },
      {
        code: setup(`
const a = useA();
const b = useB();
const x = ref(0);
const y = shallowRef(0);
`)
      },
      {
        code: `<script lang="ts">const n = ref(0); const props = defineProps<P>();</script>`
      }
    ],
    invalid: [
      {
        code: setup(`const n = ref(0); const props = defineProps<P>();`),
        errors: [
          {
            messageId: "outOfOrder",
            data: { section: "macros", later: "state" }
          }
        ]
      },
      {
        code: setup(
          `const store = useStore(); const props = defineProps<P>();`
        ),
        errors: [
          {
            messageId: "outOfOrder",
            data: { section: "macros", later: "composables" }
          }
        ]
      },
      {
        code: setup(`const n = ref(0); const store = useStore();`),
        errors: [
          {
            messageId: "outOfOrder",
            data: { section: "composables", later: "state" }
          }
        ]
      },
      {
        code: setup(`const d = computed(() => 1); const n = ref(0);`),
        errors: [
          {
            messageId: "outOfOrder",
            data: { section: "state", later: "computed" }
          }
        ]
      },
      {
        code: setup(`watch(n, () => {}); const d = computed(() => 1);`),
        errors: [
          {
            messageId: "outOfOrder",
            data: { section: "computed", later: "watchers" }
          }
        ]
      },
      {
        code: setup(`function go() {} watch(n, () => {});`),
        errors: [
          {
            messageId: "outOfOrder",
            data: { section: "watchers", later: "functions" }
          }
        ]
      },
      {
        code: setup(`onMounted(() => {}); function go() {}`),
        errors: [
          {
            messageId: "outOfOrder",
            data: { section: "functions", later: "lifecycle hooks" }
          }
        ]
      },
      {
        code: setup(`const go = () => {}; const n = ref(0);`),
        errors: [
          {
            messageId: "outOfOrder",
            data: { section: "state", later: "functions" }
          }
        ]
      }
    ]
  });
});
