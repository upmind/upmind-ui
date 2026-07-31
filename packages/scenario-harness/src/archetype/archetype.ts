import { isPlainObject } from "lodash-es";
import type {
  Archetype,
  ArchetypeDecision,
  ArchetypeSignals
} from "./archetype.types";
import type { ReflectedSnapshot } from "../reflection/reflection.types";
import type { JsonSchema } from "@jsonforms/core";

/**
 * The Form guard: a non-null plain object typed `"object"`,
 * carrying a plain `properties` map, or declaring a composition keyword —
 * the structural minimum of `@jsonforms/core`'s `JsonSchema`. Reads only the
 * candidate's own structure, never a key name, so neither confirmed
 * false-friend (`useBasket`'s boolean-bag `uischema`, `useBrand`'s
 * `uischema_*` naming collisions) can pass.
 */
export function isRealJsonSchema(candidate: unknown): candidate is JsonSchema {
  if (!isPlainObject(candidate)) return false;

  const schema = candidate as Record<string, unknown>;

  return (
    schema.type === "object" ||
    isPlainObject(schema.properties) ||
    "anyOf" in schema ||
    "oneOf" in schema ||
    "allOf" in schema
  );
}

/**
 * Pure, total, first-match archetype classification. Never
 * throws; an unmatched snapshot resolves to Action-panel, with every
 * predicate result recorded on {@link ArchetypeDecision.signals} so the
 * fallback is auditable rather than silent.
 */
export function classify(
  snapshot: ReflectedSnapshot,
  hasTableChannel: boolean
): ArchetypeDecision {
  const signals: ArchetypeSignals = {
    hasRealSchema: isRealJsonSchema(snapshot.context.schema),
    hasModel: isPlainObject(snapshot.context.model),
    hasTable: hasTableChannel,
    hasDataArray: Array.isArray(snapshot.context.data)
  };

  const archetype: Archetype =
    signals.hasRealSchema && signals.hasModel
      ? "form-flow"
      : signals.hasTable || signals.hasDataArray
        ? "list"
        : signals.hasModel
          ? "detail"
          : "action-panel";

  return { archetype, signals };
}
