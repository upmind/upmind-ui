// -----------------------------------------------------------------------------
/**
 * @module inspector/types
 * @description Type definitions for Inspector component.
 */

import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

export type MetaBadgeColor =
  | "success"
  | "info"
  | "warning"
  | "neutral"
  | "promo"
  | "danger"
  | "primary";

export type ContextItem = {
  /** The value to display */
  value: unknown;
  /** Hide this item if the value is empty/null/undefined */
  hideIfEmpty?: boolean;
};

export type InspectorSection = {
  /** Section name (displayed in tab) */
  name: string;
  /** Machine state value */
  state?: unknown;
  /** Error to display (shown with Alert component) */
  errors?: unknown;
  /** Meta flags object (key-value pairs where values are truthy/falsy or ComputedRef) */
  meta?: Record<string, boolean | ComputedRef<boolean> | undefined>;
  /** Context values object */
  context?: Record<string, unknown | ContextItem>;
  /** Scope values object */
  scope?: {
    actor: ScopeActorTypes;
    context?: Record<string, unknown>;
    brandId?: string;
    matrix: Record<ScopeActorTypes, unknown>;
  };
};
