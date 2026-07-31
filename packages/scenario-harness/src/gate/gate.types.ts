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
export interface GateInput {
  actor: ScopeActor;
  actionKeys: readonly string[];
  tags: Record<string, PlaygroundTag | undefined>;
  actionSchemas: Record<string, JsonSchema | undefined>;
  coveredActionIds: readonly string[];
}

export type GateVerdict =
  | { actionId: string; status: "covered" | "exempt"; reason?: string }
  | {
      actionId: string;
      status: "red";
      cause:
        | "untagged-input-taking"
        | "uncovered"
        | "missing-reason"
        | "dead-step";
    };

/** The full verdict set produced by one `runGate` call. */
export interface GateReport {
  verdicts: readonly GateVerdict[];
}
