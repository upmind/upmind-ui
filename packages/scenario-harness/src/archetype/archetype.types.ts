import type { ReflectedSnapshot } from "../reflection/reflection.types";
import type { ComposableKey } from "../registry/registry";
import type { ScopeActor } from "../world/scope-actor";

/** The four structural shapes `classify()` resolves to (design §6). */
export type Archetype = "form-flow" | "list" | "detail" | "action-panel";

/**
 * Every structural predicate `classify()` evaluated, recorded so a fallback
 * classification is auditable rather than silent (design §6, §11.11).
 */
export interface ArchetypeSignals {
  hasRealSchema: boolean;
  hasModel: boolean;
  hasTable: boolean;
  hasDataArray: boolean;
}

export interface ArchetypeDecision {
  archetype: Archetype;
  signals: ArchetypeSignals; // every predicate result — auditable, design §6
}

/** The reflect() output: one module, one actor, one point-in-time read (design §2). */
export interface ModuleDescriptor {
  key: ComposableKey;
  actor: ScopeActor;
  archetype: ArchetypeDecision;
  snapshot: ReflectedSnapshot;
}
