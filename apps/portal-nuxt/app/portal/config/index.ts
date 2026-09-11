// -----------------------------------------------------------------------------
/**
 * @module portal/config/index
 * @description The shipped brands, keyed by id — the config switcher's own
 * lookup table (tasks.md 6.3b). One file per brand, named FOR the brand
 * (operator ruling 2026-08-25): theme and shape config live together in it.
 *
 * The app ships ONE shape now (operator ruling 2026-08-28): hostgrid, the
 * legacy client portal's own information architecture. Strata, the first
 * Host·Grid shape and Rockzone were retired the same day — the sandbox
 * serves the portal it is becoming, not a gallery of pilots. The switcher,
 * the `?config=` query and the server pin all stay: they cost nothing while
 * one shape ships, and a second shape needs no rewiring.
 */

import { hostgridConfig } from "./hostgrid";
import type { PortalConfig } from "../types";

export const PORTAL_CONFIG_ID = {
  HOSTGRID: "hostgrid"
} as const;

export type PortalConfigId =
  (typeof PORTAL_CONFIG_ID)[keyof typeof PORTAL_CONFIG_ID];

export const DEFAULT_PORTAL_CONFIG_ID: PortalConfigId =
  PORTAL_CONFIG_ID.HOSTGRID;

export const PORTAL_CONFIGS: Readonly<Record<PortalConfigId, PortalConfig>> = {
  [PORTAL_CONFIG_ID.HOSTGRID]: hostgridConfig
};

export type PortalConfigOption = {
  readonly id: PortalConfigId;
  readonly label: string;
};

export const PORTAL_CONFIG_OPTIONS: readonly PortalConfigOption[] = [
  { id: PORTAL_CONFIG_ID.HOSTGRID, label: "Host·Grid" }
];

export function isPortalConfigId(value: unknown): value is PortalConfigId {
  return typeof value === "string" && value in PORTAL_CONFIGS;
}
