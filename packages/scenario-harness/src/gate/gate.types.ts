import type { PlaygroundTag } from "../tags/tags.types";
import type { ScopeActor } from "../world/scope-actor";
import type { JsonSchema } from "@jsonforms/core";

/**
 * Everything `runGate` needs for one scope-matrix cell: the live
 * action names, their parsed tags, the action-schema map ("input-taking" is
 * keyed off this map, never runtime param introspection — ADR-027 Am.6), and
 * the steps catalog's covered action ids. Core logic is pure; a per-module
 * vitest wrapper combines live enumeration + `tags/tags.ts` parsing to build
 * this input.
 */
export type GateInput = {
  actor: ScopeActor;
  actionKeys: readonly string[];
  tags: Record<string, PlaygroundTag | undefined>;
  actionSchemas: Record<string, JsonSchema | undefined>;
  coveredActionIds: readonly string[];
};

/** One `GateVerdict`'s `status`. */
export const GATE_STATUS = {
  COVERED: "covered",
  EXEMPT: "exempt",
  RED: "red"
} as const;

export type GateStatus = (typeof GATE_STATUS)[keyof typeof GATE_STATUS];

/** A `red` verdict's `cause`. */
export const GATE_CAUSE = {
  UNTAGGED_INPUT_TAKING: "untagged-input-taking",
  UNCOVERED: "uncovered",
  MISSING_REASON: "missing-reason",
  DEAD_STEP: "dead-step"
} as const;

export type GateCause = (typeof GATE_CAUSE)[keyof typeof GATE_CAUSE];

export type GateVerdict =
  | {
      actionId: string;
      status: typeof GATE_STATUS.COVERED | typeof GATE_STATUS.EXEMPT;
      reason?: string;
    }
  | {
      actionId: string;
      status: typeof GATE_STATUS.RED;
      cause: GateCause;
    };

/**
 * The full verdict set produced by one `runGate` call. Echoes `GateInput.actor`
 * so a caller aggregating one scope-matrix ROW (client/guest/staff/self,
 * ADR-027's multi-actor matrix) can attribute each `GateReport` back to the
 * actor it was computed for — verdicts from different cells are otherwise
 * byte-identical and un-attributable once concatenated.
 */
export type GateReport = {
  actor: ScopeActor;
  verdicts: readonly GateVerdict[];
};
