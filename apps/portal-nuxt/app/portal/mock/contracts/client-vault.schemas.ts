// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-vault.schemas
 * @description Schema/uischema for the two forms the SCOPED `client-vault`
 * module headless does not have yet carries (plan F4) — adding or editing a
 * note, and adding or editing a secret. Written in the headless shape, so
 * `/scoped-composable-factory` consumes this file unchanged alongside
 * `client-vault.ts`'s four-layer contract.
 *
 * Two schemas over the same two fields, because the VALUE is a different kind
 * of thing on each side of the `encrypted` axis: a note is prose and reads as
 * a paragraph; a secret is a credential and is masked as it is typed
 * (`PasswordRenderer`, which the platform's own `format: "password"` selects).
 *
 * @module-oracle vue-app `vaultNoteForm.vue`, `vaultSecretForm.vue`.
 */

import type { VaultAssetModel } from "./client-vault";
import type { JsonSchema7, VerticalLayout } from "@jsonforms/core";
// -----------------------------------------------------------------------------

/** The platform's own modifying keyword rides beside the core ones (`mock/forms/ajv.ts`). */
type SchemaProperty = JsonSchema7 & { trim?: boolean };

/** Legacy's own bound: a label is one line long. */
const LABEL_MAX_LENGTH = 60;

function labelProperty(title: string): SchemaProperty {
  return {
    type: "string",
    title,
    minLength: 1,
    maxLength: LABEL_MAX_LENGTH,
    trim: true
  };
}

/** Schema for the note form. */
export const useNoteSchema = (): JsonSchema7 => ({
  type: "object",
  title: "Note",
  required: ["label", "value"],
  properties: {
    label: labelProperty("What is this about?"),
    value: noteProperty()
  }
});

function noteProperty(): SchemaProperty {
  return { type: "string", title: "Note", minLength: 1, trim: true };
}

/** UI schema for the note form. */
export const useNoteUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/label",
      i18n: "form.vault_label",
      options: { placeholder: "Server access, billing contact…" }
    },
    {
      type: "Control",
      scope: "#/properties/value",
      i18n: "form.vault_note",
      options: { multi: true, placeholder: "Anything you want to remember" }
    }
  ]
});

/** Schema for the secret form — the value is masked, so it is one line. */
export const useSecretSchema = (): JsonSchema7 => ({
  type: "object",
  title: "Secret",
  required: ["label", "value"],
  properties: {
    label: labelProperty("What is this for?"),
    value: {
      type: "string",
      title: "Secret",
      format: "password",
      minLength: 1
    }
  }
});

/** UI schema for the secret form. */
export const useSecretUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/label",
      i18n: "form.vault_label",
      options: { placeholder: "Root password, API key…" }
    },
    {
      type: "Control",
      scope: "#/properties/value",
      i18n: "form.vault_secret",
      options: { autocomplete: "off" }
    }
  ]
});

/** What an ADD opens on — a blank pair, on either side of the axis. */
export const vaultDefaults = (): VaultAssetModel => ({ label: "", value: "" });
