// -----------------------------------------------------------------------------
/**
 * @module shell/types
 * @description Types for shell component tracking.
 */

export enum SHELL {
  HEADER = "header",
  FOOTER = "footer",
  LAYOUT = "layout"
}

export type Shell = `${SHELL}`;
