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
import type {
  ClientModuleItem,
  ClientModuleWireItem,
  ModuleItem,
  ModuleModel,
  ModuleWireItem
} from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/module.mappers
 * @description Module collection mappers — wire ↔ view-model shaping only.
 * No side effects, no HTTP.
 *
 * This file **never earns an actor arm** (`{module}.mappers.{actor}.ts` does
 * not exist). The test, stated in `.claude/skills/scoped-composable-factory/templates/ARMS.md`: a file can earn an arm only if it
 * holds actor-scoped state or behaviour the scope builder resolves. A mapper is
 * a pure function — input in, output out — so an arm would hold nothing, and
 * every caller would have to resolve an arm just to pick a function. When a
 * services arm reads a different endpoint and gets a different shape back, this
 * file exports an ACTOR-NAMED mapper for it (`mapClientModuleItems` beside
 * `mapModuleItems`, each with its own wire type) and the arm chooses at its own
 * `select:` call site — where the actor is already known. Same convention for
 * any `{module}.utils.ts`.
 *
 * @doctrine `code-quality.md`'s Lodash mandate (`map`/`filter`/`find`/`reduce`
 * from `lodash-es`; never native array methods here).
 * @doctrine `code-typescript.md` "No `any` — BLOCKER" — a bare `any` ships
 * only when justified inline. `client-email/client-email.mappers.ts` types
 * its raw parameter as the real wire type (`IEmail | IEmail[]`, from
 * `@upmind-automation/types`) rather than `unknown`/`any`; this
 * module-agnostic skeleton has no real wire type to import yet, so
 * `ModuleWireItem` (`module.types.ts`) is the placeholder to replace with the
 * module's real request/response type — never widen either mapper back to
 * `any`.
 * @precedent `client-email/client-email.mappers.ts` (armless — plain
 * functions, no per-actor mapper split; same `T | T[]` input shape).
 */

export const mapModuleItems = (
  raw: ModuleWireItem | ModuleWireItem[]
): ModuleItem[] => {
  return map(castArray(raw), mapModuleItem);
};

export const mapModuleItem = (raw: ModuleWireItem): ModuleItem => {
  return { id: raw.id };
};

/**
 * The OUTBOUND half of the pair — view-model/form model → wire request body.
 * Present in the hybrid variant and absent from the query one because only the
 * manager writes: `module.services.ts`'s `add`/`update` send THIS, never the
 * raw form model, so a rename on the wire never leaks into the form.
 *
 * @precedent `client-email/client-email.mappers.ts`'s `mapIEmail` — same role,
 * same file, same direction.
 */
export const mapModuleRequestData = (
  model: ModuleModel
): Partial<ModuleWireItem> => {
  // Replace with this module's real form → wire shaping (snake_case keys,
  // dropped read-only fields, flattened nested objects).
  return { ...model } as Partial<ModuleWireItem>;
};

/**
 * ACTOR-NAMED MAPPER — the client arm asks for extra fields, so its `loadList`
 * maps with THIS instead of `mapModuleItems`.
 *
 * Mappers stay in this one shared util file rather than getting their own
 * `{module}.mappers.{actor}.ts` arm: a mapper is a pure function with no
 * actor-scoped state, so there is nothing for an arm to hold. The divergence
 * is which mapper the services arm CALLS, and that choice already lives in
 * `module.services.{actor}.ts` (its `select:`). Operator ruling, 2026-07-28.
 *
 * @doctrine `code-quality.md`'s Lodash mandate.
 * @doctrine `code-composables.companion.md` "Variance law" clause 3 — the
 * per-actor divergence is expressed at the services arm's call site, not by
 * scoping this util.
 */
export const mapClientModuleItems = (
  raw: ClientModuleWireItem | ClientModuleWireItem[]
): ClientModuleItem[] => {
  return map(castArray(raw), mapClientModuleItem);
};

export const mapClientModuleItem = (
  raw: ClientModuleWireItem
): ClientModuleItem => {
  return {
    ...mapModuleItem(raw),
    // --- the extra fields only the client surface returns (absent from the
    // shared read, which never asks for them)
    internalNotes: raw.internal_notes,
    flaggedBy: raw.flagged_by
  };
};
