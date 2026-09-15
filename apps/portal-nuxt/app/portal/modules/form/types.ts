// -----------------------------------------------------------------------------
/**
 * @module portal/modules/form/types
 * @description Prop contract for the `form` module (plan F1) — the ONE
 * wrapper around the design system's JSON Forms engine. Data-first, like
 * every other module: the config names the schema, the uischema, the model
 * and the SUBMIT VERB; the module touches no store and knows no facade.
 */

import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

export interface FormModuleProps {
  /** The JSON Schema the fields are generated from — a real module's `useSchema()` output, or a local one's. */
  readonly schema: JsonSchema;
  /** The layout over those fields. Absent, the engine generates one. */
  readonly uischema?: UISchemaElement;
  /** The values the form opens with, and what `reset` restores. */
  readonly model: FormModel;
  /**
   * The action verb the submit emits, ALREADY carrying its entity id where
   * the form edits one (`<verb>:<id>`) — the emitted value appends the
   * JSON-encoded model as the tail (mock/actions.ts protocol).
   */
  readonly submit: string;
  /** The submit control's label. No English default (CC22). */
  readonly submitLabel: string;
  /** The reset control's label. No English default (CC22). */
  readonly resetLabel: string;
  /**
   * Present where the form is hosted in something DISMISSABLE. It replaces the
   * reset control, because "Cancel" in a dialog means leave, not empty the
   * fields — pressed, the form emits `cancel` and the host closes. A form on a
   * page keeps reset: there, cancelling IS undoing what was typed.
   */
  readonly cancelLabel?: string;
  /** Renders every control read-only — a form shown for reference, not for editing. */
  readonly readonly?: boolean;
  /** Submits on every valid change rather than on the button — legacy's settings panels. */
  readonly autosave?: boolean;
  /** Heading above the fields. Absent, the row's own header names the form. */
  readonly title?: string;
  /** Supporting line under the heading. */
  readonly description?: string;
  /**
   * Controls beside submit and reset, each emitting `select` with its own
   * value — legacy's share dialog regenerated its link from inside the form.
   * They carry no model: a control that acts on the ENTITY rather than on
   * what has been typed goes out as a plain verb.
   */
  readonly extraActions?: readonly {
    readonly value: string;
    readonly label: string;
  }[];
}

export type FormModuleEmits = {
  select: [value: string];
  /** The dismiss control was pressed; the HOST decides what closing means. */
  cancel: [];
};
