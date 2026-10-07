/**
 * @fileoverview `xstate` — ESLint rules for the XState machine conventions,
 * replacing the `code-xstate` prose that a lint can decide.
 *
 *   guard-prefix            — a guard name starts with is / has / can (configurable)
 *   event-case              — event types are SCREAMING_SNAKE_CASE (dotted form legal)
 *   machine-file-name       — a file that calls createMachine is `*.machine.ts`
 *   typed-context           — a machine config declares its context type
 *   canonical-state-read    — no state.matches / state.context / getSnapshot outside machines
 *   use-actor-param         — a composable takes the configured actor type, not ActorRef
 *   bind-subscribe          — `subscribe: x.subscribe` is bound with `.bind(x)`
 *   machine-factory   (v5)  — an exported machine is built by a factory function
 *   setup-first       (v5)  — `setup(...).createMachine(...)`
 *   named-guards      (v5)  — no inline function as `guard`
 *   no-v4-keys        (v5)  — no `cond` / `services`
 *   actor-stubs       (v5)  — a machine file never imports its services
 *
 * The (v5) rules read the installed `xstate` major and stay silent below 5.
 *
 * @module packages/eslint-plugin-xstate
 */

import guardPrefix from "./rules/guard-prefix.mjs";
import eventCase from "./rules/event-case.mjs";
import machineFileName from "./rules/machine-file-name.mjs";
import typedContext from "./rules/typed-context.mjs";
import canonicalStateRead from "./rules/canonical-state-read.mjs";
import useActorParam from "./rules/use-actor-param.mjs";
import bindSubscribe from "./rules/bind-subscribe.mjs";
import machineFactory from "./rules/machine-factory.mjs";
import setupFirst from "./rules/setup-first.mjs";
import namedGuards from "./rules/named-guards.mjs";
import noV4Keys from "./rules/no-v4-keys.mjs";
import actorStubs from "./rules/actor-stubs.mjs";

const plugin = {
  meta: { name: "xstate", version: "1.0.0" },
  rules: {
    "guard-prefix": guardPrefix,
    "event-case": eventCase,
    "machine-file-name": machineFileName,
    "typed-context": typedContext,
    "canonical-state-read": canonicalStateRead,
    "use-actor-param": useActorParam,
    "bind-subscribe": bindSubscribe,
    "machine-factory": machineFactory,
    "setup-first": setupFirst,
    "named-guards": namedGuards,
    "no-v4-keys": noV4Keys,
    "actor-stubs": actorStubs
  }
};

export default plugin;
