import { GATE_CAUSE, GATE_STATUS, TAG_KIND } from "./gate.types";
import type { GateInput, GateReport, GateVerdict } from "./gate.types";
// -----------------------------------------------------------------------------
/**
 * @module gate/coverage-gate
 * @description The coverage gate: grades every live action of one
 * scope-matrix cell as covered, exempt or red.
 */

function actionVerdict(
  actionId: string,
  { tags, actionSchemas }: Pick<GateInput, "tags" | "actionSchemas">,
  covered: ReadonlySet<string>
): GateVerdict {
  const tag = Object.hasOwn(tags, actionId) ? tags[actionId] : undefined;

  if (tag?.kind === TAG_KIND.EXCLUDE) {
    return tag.reason
      ? { actionId, status: GATE_STATUS.EXEMPT, reason: tag.reason }
      : {
          actionId,
          status: GATE_STATUS.RED,
          cause: GATE_CAUSE.MISSING_REASON
        };
  }

  const actionSchema = Object.hasOwn(actionSchemas, actionId)
    ? actionSchemas[actionId]
    : undefined;

  if (!tag && actionSchema !== undefined) {
    return {
      actionId,
      status: GATE_STATUS.RED,
      cause: GATE_CAUSE.UNTAGGED_INPUT_TAKING
    };
  }

  return covered.has(actionId)
    ? { actionId, status: GATE_STATUS.COVERED }
    : { actionId, status: GATE_STATUS.RED, cause: GATE_CAUSE.UNCOVERED };
}

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
    verdicts.push(actionVerdict(actionId, { tags, actionSchemas }, covered));
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
