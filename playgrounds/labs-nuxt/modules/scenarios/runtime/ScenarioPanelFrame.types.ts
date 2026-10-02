// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioPanelFrame.types
 * @description What an area hands the frame around one of its panels.
 */

// -----------------------------------------------------------------------------

export type ScenarioPanelFrameProps = {
  /** The panel's key local to its area — the prefix of every param it owns. */
  namespace: string;
};
