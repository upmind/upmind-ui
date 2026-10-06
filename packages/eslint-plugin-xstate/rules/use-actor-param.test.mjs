/**
 * @fileoverview RuleTester spec for `use-actor-param`.
 *
 * Discriminators: a `use*` function parameter typed with a raw XState actor
 * type fails and names the configured actor type; a configured type, a
 * non-composable function, or an unannotated parameter passes; the options
 * `forbidden` and `use` replace the defaults.
 *
 * Run: node --test rules/use-actor-param.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./use-actor-param.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("use-actor-param", () => {
  ruleTester.run("use-actor-param", rule, {
    valid: [
      { code: `function useThing(actor: UseActor<Machine>) {}` },
      { code: `function useThing(actor) {}` },
      { code: `function buildThing(actor: AnyActorRef) {}` },
      { code: `function user(actor: AnyActorRef) {}` },
      { code: `const useThing = (actor: UseActor<Machine>) => {};` },
      {
        code: `function useThing(actor: ActorRef<any, any>) {}`,
        options: [{ forbidden: ["Interpreter"] }]
      }
    ],
    invalid: [
      {
        code: `function useThing(actor: AnyActorRef) {}`,
        errors: [
          {
            messageId: "actorParam",
            data: { name: "AnyActorRef", use: "UseActor" }
          }
        ]
      },
      {
        code: `const useThing = (actor: ActorRef<any, any>) => {};`,
        errors: [
          {
            messageId: "actorParam",
            data: { name: "ActorRef", use: "UseActor" }
          }
        ]
      },
      {
        code: `const useThing = function (actor: Interpreter<M>) {};`,
        errors: [{ messageId: "actorParam" }]
      },
      {
        code: `function useThing(actor: AnyInterpreter | null) {}`,
        errors: [
          {
            messageId: "actorParam",
            data: { name: "AnyInterpreter", use: "UseActor" }
          }
        ]
      },
      {
        code: `function useThing(actor: Interpreter<M>) {}`,
        options: [{ forbidden: ["Interpreter"], use: "ConfiguredActor" }],
        errors: [
          {
            messageId: "actorParam",
            data: { name: "Interpreter", use: "ConfiguredActor" }
          }
        ]
      }
    ]
  });
});
