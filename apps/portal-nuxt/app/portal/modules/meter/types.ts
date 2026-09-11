// -----------------------------------------------------------------------------
/**
 * @module portal/modules/meter/types
 * @description Prop contract for the `meter` module — a determinate progress
 * bar, over `@upmind/ui`'s `Progress`. The Host·Grid render seats one in its
 * setup panel's header (a thin dark bar tracking completion).
 */

/**
 * How a meter READS — legacy's four bands off the percentage remaining
 * (`creditLimitSummaryMsg.vue:47-52`: danger under 25, warning under 50,
 * caution under 75, success above).
 *
 * `caution` maps to the library's `primary` accent: `@upmind/ui`'s `Progress`
 * publishes primary / success / warning / danger and no caution tone, and a
 * migration never forks the library for a fifth. The BAND is still its own,
 * so the four read apart.
 */
export const METER_MODULE_TONE = {
  DANGER: "danger",
  WARNING: "warning",
  CAUTION: "primary",
  SUCCESS: "success"
} as const;

export type MeterModuleTone =
  (typeof METER_MODULE_TONE)[keyof typeof METER_MODULE_TONE];

export interface MeterModuleProps {
  /** The filled amount. */
  readonly value: number;
  /** The scale's end. Absent = 100. */
  readonly max?: number;
  /** Accessible name for the bar. No English default (CC22). */
  readonly label: string;
  /** How the bar reads; absent takes the library's own accent. */
  readonly tone?: MeterModuleTone;
}
