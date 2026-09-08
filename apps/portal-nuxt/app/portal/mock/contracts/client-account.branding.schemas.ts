// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-account.branding.schemas
 * @description Schema/uischema for legacy's `parentBrandAppearanceForm`
 * (plan F4) — the appearance a parent account lends to the accounts it
 * manages: a name, a colour and a font.
 *
 * The IMAGE fields legacy carried beside them (logo, favicon) stay out: the
 * plan takes no uploads (§5), and a picture the mock cannot receive is not a
 * field it can honestly ask for.
 *
 * @module-oracle vue-app `parentBrandAppearanceForm.vue:20-70`.
 */

import { map } from "lodash-es";
import type { ParentBrandingContext } from "./client-account";
import type {
  ControlElement,
  JsonSchema7,
  VerticalLayout
} from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

type SchemaChoice = { label: string; value: string };

type SchemaProperty = JsonSchema7 & {
  options?: SchemaChoice[];
  trim?: boolean;
};

/** A brand name is one line long. */
const BRAND_NAME_MAX = 60;

/**
 * A six-digit hex colour with its hash — what legacy's own colour picker
 * emitted, and the only spelling the swatch beside the field can read.
 */
const HEX_COLOUR_PATTERN = "^#[0-9a-fA-F]{6}$";

/**
 * The faces a parent may lend. Legacy opened Google Fonts and took whatever
 * came back; a mock has no catalogue to open, so the choice is the fixed list
 * the seeds are authored from.
 */
export const PARENT_BRANDING_FONTS: readonly string[] = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Source Sans 3"
];

/** Schema for the appearance form. */
export const useBrandingSchema = (): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    name: {
      type: "string",
      title: "Brand name",
      minLength: 1,
      maxLength: BRAND_NAME_MAX,
      trim: true
    },
    colour: {
      type: "string",
      title: "Brand colour",
      pattern: HEX_COLOUR_PATTERN,
      description: "A six-digit hex colour, such as #1F5EFF."
    },
    font: {
      type: "string",
      title: "Brand font",
      enum: [...PARENT_BRANDING_FONTS],
      options: map(PARENT_BRANDING_FONTS, face => ({
        label: face,
        value: face
      }))
    }
  };
  return {
    type: "object",
    title: "Brand appearance",
    required: ["name", "colour", "font"],
    properties
  };
};

function control(
  scope: string,
  options?: ControlElement["options"]
): ControlElement {
  return { type: "Control", scope: `#/properties/${scope}`, options };
}

/** UI schema for the appearance form. */
export const useBrandingUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    control("name", { placeholder: "What the accounts you manage see" }),
    control("colour", { placeholder: "#1F5EFF" }),
    control("font")
  ]
});

/** What the form opens on — the appearance on file. */
export const brandingDefaults = (
  context: ParentBrandingContext
): FormModel => ({
  name: context.name,
  colour: context.colour,
  font: context.font
});
