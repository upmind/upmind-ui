import type { GateInput, GateReport, GateVerdict } from "./gate.types";

/**
 * The pure coverage-gate verdict function. Tags are read as data
 * only — untagged non-input-taking members default to include (fail on
 * coverage, not on tagging, if uncovered); "input-taking" is keyed off
 * {@link GateInput.actionSchemas}, never runtime param introspection.
 */
export function runGate({
  actionKeys,
  tags,
  actionSchemas,
  coveredActionIds
}: GateInput): GateReport {
  const covered = new Set(coveredActionIds);
  const live = new Set(actionKeys);
  const verdicts: GateVerdict[] = [];

  for (const actionId of actionKeys) {
    const tag = tags[actionId];

    if (tag?.kind === "exclude") {
      verdicts.push(
        tag.reason
          ? { actionId, status: "exempt", reason: tag.reason }
          : { actionId, status: "red", cause: "missing-reason" }
      );
      continue;
    }

    if (!tag && actionSchemas[actionId] !== undefined) {
      verdicts.push({
        actionId,
        status: "red",
        cause: "untagged-input-taking"
      });
      continue;
    }

    verdicts.push(
      covered.has(actionId)
        ? { actionId, status: "covered" }
        : { actionId, status: "red", cause: "uncovered" }
    );
  }

  // A step naming an action no longer live is drift, not a coverage gap.
  for (const actionId of coveredActionIds) {
    if (!live.has(actionId)) {
      verdicts.push({ actionId, status: "red", cause: "dead-step" });
    }
  }

  return { verdicts };
}
