import type { ReflectedSnapshot } from "../reflection/reflection.types";
import type { ScopeActor } from "../world/scope-actor";
import type { JsonSchema } from "@jsonforms/core";

/** The four structural shapes `classify()` resolves to. */
export const ARCHETYPE = {
  FORM_FLOW: "form-flow",
  LIST: "list",
  DETAIL: "detail",
  ACTION_PANEL: "action-panel"
} as const;

export type Archetype = (typeof ARCHETYPE)[keyof typeof ARCHETYPE];

/**
 * `@jsonforms/core`'s own `JsonSchema.type` is a literal union, not a
 * runtime enum (the wire keyword is the ecosystem standard) — reusing its
 * typing here, rather than inventing a package-local enum, still turns a
 * typo into a compile error with zero new vocabulary (item 2, option c).
 */
export const OBJECT_SCHEMA_TYPE = "object" satisfies JsonSchema["type"];

/**
 * Every structural predicate `classify()` evaluated, recorded so a fallback
 * classification is auditable rather than silent.
 */
export interface ArchetypeSignals {
  hasRealSchema: boolean;
  hasModel: boolean;
  hasTable: boolean;
  hasDataArray: boolean;
}

export interface ArchetypeDecision {
  archetype: Archetype;
  signals: ArchetypeSignals; // every predicate result — auditable rather than silent
}

/**
 * The reflect() output: one module, one actor, one point-in-time read. `K`
 * is the consumer's own manifest key union (item 4/4a) — never a
 * package-baked `ComposableKey`.
 */
export interface ModuleDescriptor<K extends string = string> {
  key: K;
  actor: ScopeActor;
  archetype: ArchetypeDecision;
  snapshot: ReflectedSnapshot;
}
