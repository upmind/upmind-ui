import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./lazy-route-component.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("lazy-route-component", () => {
  ruleTester.run("lazy-route-component", rule, {
    valid: [
      {
        code: `const routes = [{ path: "/", component: () => import("./Home.vue") }];`
      },
      {
        code: `import Home from "./Home.vue"; const routes = [{ path: "/", component: () => import("./Home.vue") }];`
      },
      {
        code: `import type Home from "./Home.vue"; const routes = [{ path: "/", component: Home }];`
      },
      {
        code: `import Layout from "./layout"; const routes = [{ path: "/", component: Layout }];`
      },
      {
        code: `import Home from "./Home.vue"; const routes = [{ path: "/", meta: Home }];`
      },
      { code: `const routes = [{ path: "/", component: Unknown }];` }
    ],
    invalid: [
      {
        code: `import Home from "./Home.vue"; const routes = [{ path: "/", component: Home }];`,
        errors: [{ messageId: "eagerComponent", data: { name: "Home" } }]
      },
      {
        code: `import Home from "./Home.vue"; const routes = [{ path: "/", "component": Home }];`,
        errors: [{ messageId: "eagerComponent" }]
      },
      {
        code: `import { Foo } from "./Foo.vue"; const routes = [{ path: "/", component: Foo }];`,
        errors: [{ messageId: "eagerComponent", data: { name: "Foo" } }]
      },
      {
        code: `import A from "./A.vue"; import B from "./B.vue"; const routes = [{ path: "/a", component: A }, { path: "/b", component: B }];`,
        errors: [
          { messageId: "eagerComponent" },
          { messageId: "eagerComponent" }
        ]
      }
    ]
  });
});
