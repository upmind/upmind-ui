/** @internal *
 * `@precedent` citations point at `client-email/` — the only query-backed scoped
 * module, and the FE-2824 implementation this bundle's anti-cosplay law was
 * written about. Cite it for facts; never copy its shape.
 */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-quality.md` (general hygiene, Lodash mandate —
 * cite, never restate). A disagreement between this skeleton, its worked
 * example, and the doctrine is a surfaced finding, never silently resolved
 * toward either.
 */

import { map, castArray } from "lodash-es";
import type { {Module} } from "./module.types";
import type { I{Module} } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module module/module.mappers
 * @description Module collection mappers — wire ↔ view-model shaping only.
 * No side effects, no HTTP.
 *
 * This file **never earns an actor arm** (`{module}.mappers.{actor}.ts` does
 * not exist). The test, stated in `.claude/skills/factory/composable/templates/ARMS.md`: a file can earn an arm only if it
 * holds actor-scoped state or behaviour the scope builder resolves. A mapper is
 * a pure function — input in, output out — so an arm would hold nothing, and
 * every caller would have to resolve an arm just to pick a function. When a
 * services arm reads a different endpoint and gets a different shape back, the
 * arm carries its ACTOR-NAMED mapper (`mapClient{Module}s` in
 * `module.services.{actor}.ts`, with its own wire type) and chooses it at its
 * own `select:` call site — where the actor is already known. The day the arm
 * is earned, lift that mapper into THIS file as an extra export (the shape
 * gate grades missing exports, never extra ones) so mappers stay in one place.
 * Same convention for any `{module}.utils.ts`.
 *
 * @doctrine `code-quality.md`'s Lodash mandate (`map`/`filter`/`find`/`reduce`
 * from `lodash-es`; never native array methods here).
 * @doctrine `code-typescript.md` "No `any` — BLOCKER" — a bare `any` ships
 * only when justified inline. `client-email/client-email.mappers.ts` types
 * its raw parameter as the real wire type (`IEmail | IEmail[]`, from
 * `@upmind-automation/types`) rather than `unknown`/`any`; this
 * `I{Module}` here is that generated wire type (`@upmind-automation/types`),
 * never a hand-minted placeholder — and never widen either mapper back to
 * `any`.
 * @precedent `client-email/client-email.mappers.ts` (armless — plain
 * functions, no per-actor mapper split; same `T | T[]` input shape).
 */

export const map{Module}s = (
  raw: I{Module} | I{Module}[]
): {Module}[] => {
  return map(castArray(raw), map{Module});
};

export const map{Module} = (raw: I{Module}): {Module} => {
  return { id: raw.id };
};

