/**
 * @module foundation/renderers
 * @description The form-renderer socket: ADR 023 §7.
 */
import type { FormProps } from "@upmind/ui";

/**
 * One renderer registration in the shape `ui`'s form engine accepts — derived
 * from `ui`'s own prop, so `foundation` never names the engine's JSONForms types.
 */
export type FormRendererEntry = NonNullable<
  FormProps["additionalRenderers"]
>[number];
