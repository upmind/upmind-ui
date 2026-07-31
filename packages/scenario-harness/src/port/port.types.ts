import type { ControlledTableChannel } from "./table-channel.types";
import type { ReflectedSnapshot } from "../reflection/reflection.types";

/**
 * The seam port (ADR-027 d.4 shape). Meta rule, stated once: flags cross the
 * port as already-evaluated booleans — the adapter derefs every `.value`, the
 * core never owns a predicate (design §3).
 */
export interface CompositionPort {
  snapshot(): ReflectedSnapshot;
  getMeta(): Record<string, boolean>;
  actions: Record<string, (input?: unknown) => unknown | Promise<unknown>>;
  table?: ControlledTableChannel; // present iff the module owns table state
}
