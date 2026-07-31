import type { ReflectedSnapshot } from "../reflection/reflection.types";
import type { ComposableKey } from "../registry/registry";
import type { ScopeActor } from "../world/scope-actor";

/** The four structural shapes `classify()` resolves to. */
export type Archetype = "form-flow" | "list" | "detail" | "action-panel";

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

/** The reflect() output: one module, one actor, one point-in-time read. */
export interface ModuleDescriptor {
  key: ComposableKey;
  actor: ScopeActor;
  archetype: ArchetypeDecision;
  snapshot: ReflectedSnapshot;
}
