// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioPanel.types
 * @description What a host hands one drawn binding: the registered declaration
 * it boots and, inside an area, how it sits under the area's page.
 *
 * Nothing is minted that already exists: `RegisteredScenario` is the
 * declaration once the registry has attached its directory, and a panel of an
 * area is handed in as one (the registry flattens it).
 */

import type { RegisteredScenario } from "./scenario.types";

// -----------------------------------------------------------------------------

export type ScenarioPanelProps = {
  /** The binding this panel boots and draws. */
  scenario: RegisteredScenario;
  /**
   * The panel is one of several under an area's page: it draws no page frame
   * and no h1, leaves the sheet toggle to the area, and registers no scope
   * contexts of its own.
   */
  embedded?: boolean;
  /** The area's lead panel — the one that owns the page's Code and Scenario panes. */
  primary?: boolean;
  /** The panel's heading, already translated; absent, the panel draws none. */
  heading?: string;
};
