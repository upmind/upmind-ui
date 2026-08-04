// -----------------------------------------------------------------------------
/**
 * @module factory/surfaces/ActionPanelSurface
 * @description Type definitions for the Action-panel archetype surface
 * (design.md FE-2977 §Block C).
 */

import type { SurfaceProps } from "./surface.types";
import type { FormProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

export type ActionInputSchema = {
  schema: FormProps["schema"];
  uischema?: FormProps["uischema"];
};

/**
 * Optional, generic per-action input-schema convention a composable MAY
 * expose on its context so an action renders an inline input form before
 * firing — absent for actions that take no input. Not part of
 * `ReflectedSnapshot`'s core shape; read defensively.
 */
export type ActionSchemasContext = {
  actionSchemas?: Record<string, ActionInputSchema>;
};

export type ActionPanelSurfaceProps = SurfaceProps;
