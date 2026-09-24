/**
 * @module foundation/renderers
 * @description The form-renderer socket.
 */
import type { FormProps } from "@upmind/ui";

export type FormRendererEntry = NonNullable<
  FormProps["additionalRenderers"]
>[number];
