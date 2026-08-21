/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `Transport` / `TransportProps` / `TransportControl` node exists anywhere in
 * the tree, and `packages/ui` ships no media-transport component to consume, so
 * this contract is minted. What it does NOT mint: the control's presentation is
 * `@upmind-automation/upmind-ui`'s own `ButtonProps` icon/variant channels, and
 * `playhead` / `sceneCount` are reads of the player's own numbers
 * (`useScenarioPlayer`, T4.2) rather than a second model of a track. See
 * `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/Transport.types
 * @description Type definitions for the media transport — the four controls a
 * recorded track is played with, and the two numbers that decide which of them
 * still have something to do.
 */

import type { ButtonProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

/**
 * The controls, keyed by the player call each one asks for (`design.md` §3.1) —
 * never by the words on screen, which are i18n keys.
 *
 * `STOP` is the media bar's own exit (`R7-9`): while a track holds the surface,
 * picking Live is a PLAYLIST gesture that happens to release it, which reads as
 * "choose something else" rather than "stop this". A transport says stop where
 * every transport ever built says it — beside the controls that started it.
 */
export const TRANSPORT_CONTROL = {
  PREV: "prev",
  PLAY: "play",
  PAUSE: "pause",
  NEXT: "next",
  STOP: "stop"
} as const;

export type TransportControl =
  (typeof TRANSPORT_CONTROL)[keyof typeof TRANSPORT_CONTROL];

export type TransportProps = {
  /** The player is running scenes — the transport offers pause rather than play. */
  playing: boolean;
  /**
   * The scene the surface is at, as an index into the armed track's scenes.
   * `-1` is the armed-but-nothing-run state, so stepping back has nowhere to go.
   */
  playhead: number;
  /** How many scenes the armed track declares. */
  sceneCount: number;
  /**
   * A scene is in flight. The control the hand touched carries the pending
   * state (`E12`/`S14`) — the player knows a scene is running, only this
   * component knows which control asked for it.
   */
  busy?: boolean;
};

/** Each control asks the player for exactly the call it is named after. */
export type TransportEmits = {
  play: [];
  pause: [];
  prev: [];
  next: [];
  stop: [];
};

/** One rendered control: what it looks like, what it is called, what it asks for. */
export type TransportControlItem = {
  key: TransportControl;
  icon: string;
  label: string;
  color: ButtonProps["color"];
  disabled: boolean;
  loading: boolean;
  onSelect: () => void;
};
