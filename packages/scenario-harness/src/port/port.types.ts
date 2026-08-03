import type { ControlledTableChannel } from "./table-channel.types";
import type { ReflectedSnapshot } from "../reflection/reflection.types";

/**
 * The seam port (ADR-027 d.4 shape). Meta rule, stated once: flags cross the
 * port as already-evaluated booleans — the adapter derefs every `.value`, the
 * core never owns a predicate.
 */
export interface CompositionPort {
  snapshot(): ReflectedSnapshot;
  // ADR-027 d.4's port shape names this member explicitly; kept for that
  // reason even though the core never calls it — `reflect()` reads meta
  // exclusively from `snapshot().meta` (the one core-facing meta surface).
  // `getMeta()` is adapter-facing: a consumer outside the reflection
  // pipeline that wants an already-evaluated meta read without pulling a
  // full snapshot (mirroring the labs Inspector precedent ADR-027 d.4
  // cites) calls this directly. An adapter implementing both MUST derive
  // them from the same source so they cannot diverge.
  getMeta(): Record<string, boolean>;
  actions: Record<string, (input?: unknown) => unknown | Promise<unknown>>;
  table?: ControlledTableChannel; // present iff the module owns table state
}
