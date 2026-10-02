// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioArea.types
 * @description What the host hands an area: the registered declaration whose
 * `tabs` it draws. `RegisteredScenario` is the registry's own, consumed.
 */

import type { RegisteredScenario } from "./scenario.types";

// -----------------------------------------------------------------------------

export type ScenarioAreaProps = {
  /** The area — a declaration carrying `tabs`. */
  scenario: RegisteredScenario;
};
