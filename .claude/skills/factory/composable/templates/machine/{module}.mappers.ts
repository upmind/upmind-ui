/** @internal */
// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-quality.md` (general hygiene, Lodash mandate —
 * cite, never restate). A disagreement between this skeleton, its worked
 * example, and the doctrine is a surfaced finding, never silently resolved
 * toward either.
 */

import type { ModuleModel } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/module.mappers
 * @description Module model mappers — wire ↔ view-model shaping only. No
 * side effects, no HTTP.
 *
 * This file **never earns an actor arm** (`{module}.mappers.{actor}.ts` does
 * not exist). The test, stated in `.claude/skills/factory/composable/templates/ARMS.md`: a file can earn an arm only if it
 * holds actor-scoped state or behaviour the scope builder resolves. A mapper is
 * a pure function — input in, output out — so an arm would hold nothing, and
 * every caller would have to resolve an arm just to pick a function. When a
 * services arm posts to a different surface and that surface expects a
 * different payload, the arm carries its ACTOR-NAMED mapper
 * (`mapClientModuleRequestData` in `module.services.{actor}.ts`) and chooses
 * it at its own call site — where the actor is already known. The day the arm
 * is earned, lift that mapper into THIS file as an extra export (the shape
 * gate grades missing exports, never extra ones) so mappers stay in one place.
 * Same convention for any `{module}.utils.ts`.
 *
 * @doctrine `code-quality.md`'s Lodash mandate (`map`/`filter`/`find`/`reduce`
 * from `lodash-es`; never native array methods here).
 * @worked-example `account/account.mappers.ts` (armless — a plain function,
 * no per-actor mapper split); `client-email/client-email.mappers.ts` is the
 * query-variant equivalent (see `templates/query/`).
 */

/**
 * Maps the module's form model to the API request shape.
 */
export function mapModuleRequestData(
  model: ModuleModel
): Record<string, unknown> {
  return { ...model };
}

