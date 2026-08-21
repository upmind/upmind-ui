// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ModuleStateNotice.types
 * @description Type definitions for the shared non-ready-state notice every
 * archetype surface renders in place of its normal content.
 *
 * @graphify-citation `graphify query "module state loading error ready"`
 * (2026-08-10) — `graphify-out/graph.json` carries no second `ModuleState`
 * declaration; this file consumes `module-state.types.ts`'s enum, minting none.
 */

import type { ModuleState } from "./module-state.types";
import type { AlertProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

export type ModuleStateNoticeProps = {
  state: Exclude<ModuleState, ModuleState.READY>;
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
