import { GATE_CAUSE, GATE_STATUS, TAG_KIND } from "./gate.types";
import type { GateInput, GateReport, GateVerdict } from "./gate.types";

/**
 * The pure coverage-gate verdict function. Tags are read as data
 * only — untagged non-input-taking members default to include (fail on
 * coverage, not on tagging, if uncovered); "input-taking" is keyed off
 * {@link GateInput.actionSchemas}, never runtime param introspection.
 */
export function runGate({
  actor,
  actionKeys,
  tags,
  actionSchemas,
  coveredActionIds
}: GateInput): GateReport {
  const covered = new Set(coveredActionIds);
  const live = new Set(actionKeys);
  const verdicts: GateVerdict[] = [];

  for (const actionId of actionKeys) {
    const tag = Object.hasOwn(tags, actionId) ? tags[actionId] : undefined;

    if (tag?.kind === TAG_KIND.EXCLUDE) {
      verdicts.push(
        tag.reason
          ? { actionId, status: GATE_STATUS.EXEMPT, reason: tag.reason }
          : {
              actionId,
              status: GATE_STATUS.RED,
              cause: GATE_CAUSE.MISSING_REASON
            }
      );
      continue;
    }

    const actionSchema = Object.hasOwn(actionSchemas, actionId)
      ? actionSchemas[actionId]
      : undefined;

    if (!tag && actionSchema !== undefined) {
      verdicts.push({
        actionId,
        status: GATE_STATUS.RED,
        cause: GATE_CAUSE.UNTAGGED_INPUT_TAKING
      });
      continue;
    }

    verdicts.push(
      covered.has(actionId)
        ? { actionId, status: GATE_STATUS.COVERED }
        : { actionId, status: GATE_STATUS.RED, cause: GATE_CAUSE.UNCOVERED }
    );
  }

  // A step naming an action no longer live is drift, not a coverage gap.
  for (const actionId of coveredActionIds) {
    if (!live.has(actionId)) {
      verdicts.push({
        actionId,
        status: GATE_STATUS.RED,
        cause: GATE_CAUSE.DEAD_STEP
      });
    }
  }

  return { actor, verdicts };
}
