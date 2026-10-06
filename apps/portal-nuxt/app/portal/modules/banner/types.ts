// -----------------------------------------------------------------------------
/**
 * @module portal/modules/banner/types
 * @description Prop contract for the `banner` module (tasks.md 5.3) —
 * Banner/Notice, over `@upmind/ui`'s `AnnouncementBar` and `Alert`.
 */

import type { AlertProps } from "@upmind/ui";
// -----------------------------------------------------------------------------

export const BANNER_VARIANT = {
  /** A page-level announcement band, over `AnnouncementBar`. */
  BANNER: "banner",
  /** An in-content notice, over `Alert`. */
  NOTICE: "notice"
} as const;

export type BannerVariant =
  (typeof BANNER_VARIANT)[keyof typeof BANNER_VARIANT];

export type BannerModuleProps = {
  /** The registered module variant (registry.ts) — which of the two forms renders. */
  readonly variant?: BannerVariant;
  /** The message body, read by both forms. No English default (CC22) — the consumer supplies its own copy. */
  readonly message: string;
  /** `notice` only — a heading above the message. */
  readonly title?: string;
  /** Semantic intent — the shared vocabulary both forms' own intent unions carry. */
  readonly tone?: AlertProps["variant"];
  /**
   * `banner` only — accessible name of the region landmark. Required
   * unconditionally, like `PortalFrameProps.sidebarBackLabel` (shell/types.ts)
   * — never defaulted (CC22).
   */
  readonly label: string;
  /** `banner` only — aria-label for its dismiss control. */
  readonly dismissLabel: string;
  /** `banner` only — render the dismiss control. */
  readonly dismissible?: boolean;
  /**
   * `banner` only — what dismissing EMITS. A band raised by the route's own
   * query has to leave that query behind to stay dismissed, and only the
   * caller knows where that leaves the client. Absent, dismissing just closes
   * the band.
   */
  readonly dismissValue?: string;
  /**
   * A control beside the message (legacy's "Review billing", "Complete
   * setup"). Selecting it emits `select` with this action's own value; the
   * module renders, it does not decide.
   */
  readonly action?: {
    readonly value: string;
    readonly label: string;
  };
};

export type BannerModuleEmits = {
  select: [value: string];
};
