// -----------------------------------------------------------------------------
/**
 * @module components/sheets
 * @description The page's own internals, one click away: the ONE host over the
 * page and the three views it holds — Debug, Code and Scenario (`G14 refined`,
 * `AC3.1`). It replaces `app/components/inspector/**` entirely.
 *
 * `SheetHost` is mounted once, by the layout. Everything else here is consumed
 * by pages: `usePlaygroundSheet` to offer a section or a pane, the panes
 * themselves only through the host.
 */

export { default as CodePane } from "./CodePane.vue";
export { default as DebugPane } from "./DebugPane.vue";
export { default as ScenarioPane } from "./ScenarioPane.vue";
export { default as SheetHost } from "./SheetHost.vue";
export * from "./usePlaygroundSheet";
export * from "./usePlaygroundSheet.types";
export type * from "./CodePane.types";
export type * from "./DebugPane.types";
export type * from "./ScenarioPane.types";
