// -----------------------------------------------------------------------------
/**
 * @module factory/ModuleStateNotice
 * @description Type definitions for the shared non-ready-state notice every
 * archetype surface renders in place of its normal content.
 */

import type { ModuleState } from "./module-state.types";
import type { AlertProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

export type ModuleStateNoticeProps = {
  state: Exclude<ModuleState, "ready">;
  /** Optional extra detail (e.g. `snapshot.context.error`) shown under the notice. */
  detail?: unknown;
};

export type ModuleStateContent = Pick<
  AlertProps,
  "color" | "icon" | "title" | "description"
>;

export type ModuleStateContentMap = Record<
  ModuleStateNoticeProps["state"],
  ModuleStateContent
>;
