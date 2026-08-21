// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioStage.types
 * @description The stage contract — what a mounted surface offers a scenario.
 *
 * `graphify-out/GRAPH_REPORT.md` carries a `press()` only inside the scope
 * selector's own spec helpers; no shared stage/press surface exists to consume.
 */

/** What the collection on screen can be asked to do, as a hand would ask it. */
export type StageCollection = {
  /**
   * Press the control this action is drawn on, for this row when it names one.
   * Resolves when the press has settled — the same promise the control's own
   * feedback wrapper awaits — so a step can be paced against it.
   */
  press: (actionName: string, rowId?: string) => Promise<void>;
  /** Whether a control for this action is drawn at all right now. */
  offers: (actionName: string, rowId?: string) => boolean;
};

/** What an open editor can be asked to do. */
export type StageEditor = {
  /** Type into the form, as the user would — one patch over the live model. */
  fill: (input: Record<string, unknown>) => void;
  /** Press the form's own submit control. */
  submit: () => Promise<void>;
};

export type ScenarioStage = {
  registerCollection: (collection: StageCollection) => void;
  registerEditor: (editor: StageEditor) => void;
  /** True once a surface is mounted and offering its controls. */
  isStaged: () => boolean;
  press: StageCollection["press"];
  offers: StageCollection["offers"];
  fill: StageEditor["fill"];
  submit: StageEditor["submit"];
  /** Wait for an editor to open and boot, up to `timeout` ms. */
  whenEditor: (timeout?: number) => Promise<StageEditor>;
};
