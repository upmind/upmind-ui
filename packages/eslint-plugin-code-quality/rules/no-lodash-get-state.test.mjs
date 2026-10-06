/**
 * @fileoverview RuleTester specs for `code-quality/no-lodash-get-state`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/no-lodash-get-state.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noLodashGetState from "./no-lodash-get-state.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-lodash-get-state", () => {
  ruleTester.run("no-lodash-get-state", noLodashGetState, {
    valid: [
      { code: `import { get } from "lodash";\nget(user, "name");` },
      { code: `import { get } from "lodash";\nget(snapshot.value, "a");` },
      { code: `import _ from "lodash";\n_.get(user, "name");` },
      { code: `import { get } from "lodash";\nget();` },
      { code: `import { get } from "./helpers";\nget(state, "a");` },
      { code: `get(state, "a");` },
      { code: `import { set } from "lodash";\nset(state, "a", 1);` },
      { code: `import { pick } from "lodash";\npick(state, ["a"]);` },
      { code: `import _ from "lodash";\n_.pick(state, ["a"]);` },
      { code: `import { get } from "lodash";\nstate.get("a");` }
    ],
    invalid: [
      {
        code: `import { get } from "lodash";\nget(state, "a.b");`,
        errors: [{ messageId: "lodashGetState" }]
      },
      {
        code: `import { get } from "lodash-es";\nget(context, "a");`,
        errors: [{ messageId: "lodashGetState" }]
      },
      {
        code: `import { get } from "lodash";\nget(machine.context, "a");`,
        errors: [{ messageId: "lodashGetState" }]
      },
      {
        code: `import { get } from "lodash";\nget(this.context, "a");`,
        errors: [{ messageId: "lodashGetState" }]
      },
      {
        code: `import { get as read } from "lodash";\nread(state, "a");`,
        errors: [{ messageId: "lodashGetState" }]
      },
      {
        code: `import _ from "lodash";\n_.get(state, "a");`,
        errors: [{ messageId: "lodashGetState" }]
      },
      {
        code: `import * as _ from "lodash-es";\n_.get(context, "a");`,
        errors: [{ messageId: "lodashGetState" }]
      },
      {
        code: `import get from "lodash/get";\nget(state, "a");`,
        errors: [{ messageId: "lodashGetState" }]
      },
      {
        code: `import { get } from "lodash";\nconst v = get(state, "a") ?? get(context, "b");`,
        errors: [
          { messageId: "lodashGetState" },
          { messageId: "lodashGetState" }
        ]
      }
    ]
  });
});
