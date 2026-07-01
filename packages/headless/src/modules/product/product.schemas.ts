/** @internal */
import { useConfig } from "../config";
import { UIContext } from "../config/schema/types";
import { fieldRequiresSetup } from "../product-setup/product-setup.utils";
import { useI18n } from "../system-localisation";
import {
  hasScopeError,
  calculateBillingTerm,
  checkPriceOverride,
  parseProvisioningSchema,
  parseQuantity
} from "./product.utils";
import {
  filter,
  find,
  first,
  forEach,
  isEmpty,
  keys,
  map,
  size
} from "lodash-es";
import type {
  ProductConfigContext,
  ProductDetails,
  SubproductDetails,
  TermDetails
} from "./product.types";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------
/**
 * @module product/schemas
 * @description Generates JSON schema and UI schema for the unified product
 * configuration form. Converts product lookups (terms, options, attributes,
 * provision fields) into a single schema-driven form definition.
 *
 * JSON Schema is the single source of truth for validation.
 * Display data (meta, uiMeta, uiCategoryMeta) lives in UI schema options.
 * Lookup options (values with label/value) stay on the JSON schema.
 */

/**
 * Builds a JSON schema from the current product lookups.
 *
 * Each section (term, options, attributes, provision fields) becomes a property
 * on the root schema object. The schema is the single source of truth for
 * validation — `required` arrays, `minProperties`, `oneOf` constraints etc.
 */
export function useProductConfigSchema(
  context: ProductConfigContext
): JsonSchema7 {
  const properties: Record<string, any> = {
    productId: {
      type: "string",
      title: "Product ID",
      const: context.baseModel?.productId
    },
    quantity: buildQuantitySchema(context.lookups?.product)
  };
  const required: string[] = [];

  // --- term
  if (!isEmpty(context.lookups?.terms)) {
    properties.term = buildTermSchema(
      context.lookups!.terms!,
      // Read from `lookups.product` (ProductDetails — already plumbed by
      // callers for `buildQuantitySchema` above) rather than the top-level
      // `context.product`. The two carry the same field, but the lookups
      // path is the one every caller populates; the top-level `Product`
      // is only set when the machine spawned via `useProductConfig`. This
      // lets `applyConfigDefaults` and other one-shot helpers reach the
      // default cycle without having to synthesise a fake `Product`.
      context.lookups?.product?.defaultPaymentPeriod
    );
    required.push("term");
  }

  // --- options
  if (!isEmpty(context.lookups?.options)) {
    properties.options = buildSubproductGroupSchema(context.lookups!.options!);
  }

  // --- attributes
  if (!isEmpty(context.lookups?.attributes)) {
    properties.attributes = buildSubproductGroupSchema(
      context.lookups!.attributes!
    );
  }

  // --- provision fields (parse raw fields into JSON schema)
  if (!isEmpty(context.lookups?.provisionFields) && context.rawProduct) {
    properties.provisionFields = parseProvisioningSchema(
      context.lookups!.provisionFields,
      context.rawProduct
    );
  }

  // --- trial opt-in
  if (context.lookups?.product?.trialSupported) {
    properties.startTrial = buildTrialSchema(context.lookups.product);
  }

  return {
    type: "object",
    required,
    properties
  } as JsonSchema7;
}

/**
 * Builds the JSON schema for term selection.
 * Uses standard `enum` of primitives on a `number` type.
 * Default is calculated via `parseTerm` using brand settings,
 * not taken from the model (which could be invalid).
 */
function buildTermSchema(
  terms: TermDetails[],
  defaultPaymentPeriod: ProductDetails["defaultPaymentPeriod"]
): Record<string, any> {
  const { t } = useI18n();

  const defaultTerm =
    terms?.length === 1
      ? first(terms)
      : calculateBillingTerm(defaultPaymentPeriod, terms);

  const schema: Record<string, any> = {
    type: "number",
    title: t("term.label"),
    enum: map(terms, "cycle"),
    default: defaultTerm?.cycle,
    options: map(terms, term => ({
      ...term,
      label: term.title,
      value: term.cycle
    }))
  };

  return schema;
}

/**
 * Builds the JSON schema for quantity selection.
 * Derives `minimum`, `maximum`, and `multipleOf` constraints from the
 * product lookup data so that the schema is the single source of truth.
 */
function buildQuantitySchema(product?: ProductDetails): Record<string, any> {
  const { t } = useI18n();

  const schema: Record<string, any> = {
    type: "number",
    title: t("text.quantity"),
    default: parseQuantity(1, product)
  };

  if (product?.min) {
    schema.minimum = product.min;
  }

  if (product?.max && product.max !== Infinity) {
    schema.maximum = product.max;
  }

  if (product?.step) {
    schema.multipleOf = product.step;
  }

  return schema;
}

/**
 * Builds the JSON schema for trial opt-in selection.
 * Uses a standard string array with a single `enum` value so that
 * existing array / checkbox renderers can handle it without a custom renderer.
 * When `trialForce` is `true` the default pre-selects the trial and
 * marks the field as `readOnly` so the user cannot opt out.
 */
function buildTrialSchema(product: ProductDetails): Record<string, any> {
  return {
    type: "boolean",
    title: "Start trail",
    default: true,
    readOnly: product.trialForce,
    const: product.trialForce || undefined
  };
}

/**
 * Builds the JSON schema for a group of subproducts (options or attributes).
 * Each category becomes a property keyed by its ID.
 *
 * The schema is the single source of truth for validation:
 * - `required` on the group marks mandatory categories
 * - `minProperties` / `maxProperties` enforces selection count
 * - `propertyNames.enum` restricts valid product IDs
 * - `oneOf` with `const` discriminator validates per-value constraints
 * - `options` array carries display data for the renderer
 */
function buildSubproductGroupSchema(
  subproducts: SubproductDetails[]
): Record<string, any> {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  forEach(subproducts, subproduct => {
    const isRequired = !!subproduct.meta.required;
    const hasSingleValue = size(subproduct.values) === 1;

    // --- per-value entry schemas for oneOf discriminator
    const valueSchemas = map(subproduct.values, value => {
      const entrySchema: Record<string, any> = {
        type: "object",
        properties: {
          productId: { type: "string", const: value.id },
          cycle: { type: "number" }
        },
        required: ["productId"] as string[]
      };

      if (value.quantifiable) {
        const quantitySchema: Record<string, any> = {
          type: "number",
          minimum: value.min,
          default: value.quantity
        };
        if (value.max !== Infinity) quantitySchema.maximum = value.max;
        if (value.step > 1) quantitySchema.multipleOf = value.step;
        entrySchema.properties.quantity = quantitySchema;
        entrySchema.required.push("quantity");
      } else {
        entrySchema.properties.quantity = { type: "number" };
      }

      return entrySchema;
    });

    const schema: Record<string, any> = {
      type: isRequired ? "object" : ["object", "null"],
      title: subproduct.title,
      description: subproduct.description ?? "",
      propertyNames: { enum: map(subproduct.values, "id") },
      additionalProperties: { oneOf: valueSchemas },
      options: map(subproduct.values, value => ({
        ...value,
        label: value.title,
        value: value.id
      }))
    };

    // --- selection constraints
    if (isRequired) schema.minProperties = 1;

    if (!subproduct.meta.multiple) schema.maxProperties = 1;

    // --- auto-select default value
    // Priority: (1) value flagged as default, (2) required + single-select → first
    const defaultValue =
      find(subproduct.values, "meta.default") ??
      (isRequired && !subproduct.meta.multiple
        ? first(subproduct.values)
        : undefined);

    // Required + single value = const (cannot be deselected)
    if (isRequired && hasSingleValue) {
      const value = defaultValue ?? first(subproduct.values)!;
      schema.const = {
        [value.id]: {
          productId: value.id,
          quantity: value.quantity,
          cycle: value.cycle
        }
      };
    } else if (defaultValue) {
      schema.default = {
        [defaultValue.id]: {
          productId: defaultValue.id,
          quantity: defaultValue.quantity,
          cycle: defaultValue.cycle
        }
      };
    }

    properties[subproduct.id] = schema;

    if (isRequired) {
      required.push(subproduct.id);
    }
  });

  return {
    type: "object",
    properties,
    required
  };
}

// -----------------------------------------------------------------------------

/**
 * Builds a UI schema that drives the layout of the unified product config form.
 *
 * Custom `type` values (`Terms`, `SubProducts`) are matched by the
 * corresponding renderers via `uiTypeIs()` testers. Provision fields use
 * standard `Control` elements handled by existing renderers.
 *
 * Display data (terms array, subproduct details) is passed via `options`
 * spread flat — NOT nested under a key. `title`/`description` stay in the
 * JSON schema (standard properties), everything else goes here.
 */
export function useProductConfigUischema(
  context: ProductConfigContext
): UISchemaElement {
  const elements: any[] = [];
  const { t } = useI18n();

  // --- trial opt-in
  if (context?.lookups?.product?.trialSupported) {
    elements.push({
      type: "Control",
      scope: "#/properties/startTrial",
      i18n: "product_trial",
      options: {
        format: "card",
        items: [
          {
            value: "true",
            label: t("text.try_before_you_buy"),
            secondaryDescription: t("text.free_trial_desc", {
              days: context.lookups!.product!.trialDuration
            }),
            badge: {
              label: t("text.free_trial"),
              color: "promo",
              variant: "minimal"
            },
            dataAttrs: { "data-testid": "checkbox-item-try-before-you-buy" }
          }
        ],
        trialDuration: context.lookups!.product!.trialDuration,
        disabled: !!context.lookups!.product!.trialForce
      }
    });
  }

  // --- term selector
  if (!isEmpty(context?.lookups?.terms)) {
    const overridden =
      checkPriceOverride(
        context.model?.options ?? {},
        context.lookups?.options ?? []
      ) ||
      checkPriceOverride(
        context.model?.attributes ?? {},
        context.lookups?.attributes ?? []
      );

    elements.push({
      type: "Terms",
      scope: "#/properties/term",
      i18n: "product.term",
      options: { overridden }
    });
  }

  // --- options (one element per category)
  if (!isEmpty(context?.lookups?.options)) {
    forEach(context?.lookups!.options!, option => {
      if (isEmpty(option.values)) return;

      elements.push({
        type: "SubProducts",
        scope: `#/properties/options/properties/${option.id}`,
        i18n: "product.option",
        options: {
          meta: option.meta,
          uiMeta: option.uiMeta,
          uiCategoryMeta: option.uiCategoryMeta
        }
      });
    });
  }

  // --- attributes (one element per category)
  if (!isEmpty(context?.lookups?.attributes)) {
    forEach(context?.lookups!.attributes!, attr => {
      if (isEmpty(attr.values)) return;

      elements.push({
        type: "SubProducts",
        scope: `#/properties/attributes/properties/${attr.id}`,
        i18n: "product.attribute",
        options: {
          meta: attr.meta,
          uiMeta: attr.uiMeta,
          uiCategoryMeta: attr.uiCategoryMeta
        }
      });
    });
  }

  // --- provision fields (standard Control elements)
  if (!isEmpty(context?.lookups?.provisionFields) && context?.rawProduct) {
    const provisionSchema = parseProvisioningSchema(
      context.lookups!.provisionFields,
      context.rawProduct
    );
    if (!isEmpty(provisionSchema?.properties)) {
      forEach(keys(provisionSchema.properties), key => {
        elements.push({
          type: "Control",
          scope: `#/properties/provisionFields/properties/${key}`,
          i18n: `form.provision_field.${key}`
        });
      });
    }
  }

  return {
    type: "VerticalLayout",
    elements
  } as UISchemaElement;
}

// -----------------------------------------------------------------------------

/**
 * Builds a UISchema containing only elements that need attention.
 *
 * This mirrors `useProductConfigUischema` but only includes elements where the
 * corresponding field has an error, or (when mode is 'deferred') where deferred
 * provision fields have empty values.
 *
 * @param context - The product config context with lookups and errors
 * @param mode - 'required' (errors only) or 'deferred' (errors + empty deferred fields)
 * @returns A new UISchema containing only elements needing attention
 */
export function useInvalidProductConfigUischema(
  context: ProductConfigContext
): UISchemaElement {
  const { ui } = useConfig({ context: UIContext.CHECKOUT });
  const mode = ui.productSetup.value;
  const elements: any[] = [];
  const { t } = useI18n();
  const hasError = hasScopeError(context.basketErrors);

  // --- trial opt-in
  if (
    context?.lookups?.product?.trialSupported &&
    hasError("#/properties/startTrial")
  ) {
    elements.push({
      type: "Control",
      scope: "#/properties/startTrial",
      i18n: "product_trial",
      options: {
        format: "card",
        items: [
          {
            value: "true",
            label: t("text.try_before_you_buy"),
            secondaryDescription: t("text.free_trial_desc", {
              days: context.lookups!.product!.trialDuration
            }),
            badge: {
              label: t("text.free_trial"),
              color: "promo",
              variant: "minimal"
            },
            dataAttrs: { "data-testid": "checkbox-item-try-before-you-buy" }
          }
        ],
        trialDuration: context.lookups!.product!.trialDuration,
        disabled: !!context.lookups!.product!.trialForce
      }
    });
  }

  // --- term selector
  if (!isEmpty(context?.lookups?.terms) && hasError("#/properties/term")) {
    elements.push({
      type: "Terms",
      scope: "#/properties/term",
      i18n: "product.term"
    });
  }

  // --- options (one element per category with errors)
  if (!isEmpty(context?.lookups?.options)) {
    forEach(context?.lookups!.options!, option => {
      if (isEmpty(option.values)) return;

      const scope = `#/properties/options/properties/${option.id}`;
      if (!hasError(scope)) return;

      elements.push({
        type: "SubProducts",
        scope,
        i18n: "product.option",
        options: {
          meta: option.meta,
          uiMeta: option.uiMeta,
          uiCategoryMeta: option.uiCategoryMeta
        }
      });
    });
  }

  // --- attributes (one element per category with errors)
  if (!isEmpty(context?.lookups?.attributes)) {
    forEach(context?.lookups!.attributes!, attr => {
      if (isEmpty(attr.values)) return;

      const scope = `#/properties/attributes/properties/${attr.id}`;
      if (!hasError(scope)) return;

      elements.push({
        type: "SubProducts",
        scope,
        i18n: "product.attribute",
        options: {
          meta: attr.meta,
          uiMeta: attr.uiMeta,
          uiCategoryMeta: attr.uiCategoryMeta
        }
      });
    });
  }

  // --- provision fields (errors + empty deferred fields when mode is 'deferred')
  if (!isEmpty(context?.lookups?.provisionFields) && context?.rawProduct) {
    const provisionSchema = parseProvisioningSchema(
      context.lookups!.provisionFields,
      context.rawProduct
    );
    if (!isEmpty(provisionSchema?.properties)) {
      // Track which fields we've added (to avoid duplicates)
      const addedFields = new Set<string>();

      forEach(keys(provisionSchema.properties), key => {
        const scope = `#/properties/provisionFields/properties/${key}`;
        const fieldHasError = hasError(scope);

        // Use baseModel (set on load/update) so fields don't disappear as user types
        const field = find(context.lookups!.provisionFields, { name: key });
        const baseValue = context.baseModel?.provisionFields?.[key];
        const needsSetup = fieldRequiresSetup(
          field,
          fieldHasError,
          baseValue,
          mode
        );

        if (!needsSetup || addedFields.has(key)) return;
        addedFields.add(key);

        elements.push({
          type: "Control",
          scope,
          i18n: `form.provision_field.${key}`
        });
      });
    }
  }

  // --- autofocus the first Control element
  const firstControl = find(elements, { type: "Control" });
  if (firstControl) {
    firstControl.options = { ...firstControl.options, autoFocus: true };
  }

  return {
    type: "VerticalLayout",
    elements
  } as UISchemaElement;
}

/**
 * Generates a JSON Schema containing only properties with validation errors.
 * Used to strip a model down to only the invalid fields via useModelParser.
 *
 * @param context - The product config context with schema and errors
 * @returns A JSON Schema with only invalid property definitions, or undefined if none
 */
export function useInvalidProductConfigSchema(
  context: ProductConfigContext
): JsonSchema7 | undefined {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  const hasError = hasScopeError(context.basketErrors);

  // --- term
  if (!isEmpty(context.lookups?.terms) && hasError("#/properties/term")) {
    properties.term = buildTermSchema(
      context.lookups!.terms!,
      // Read from `lookups.product` (ProductDetails — already plumbed by
      // callers for `buildQuantitySchema` above) rather than the top-level
      // `context.product`. The two carry the same field, but the lookups
      // path is the one every caller populates; the top-level `Product`
      // is only set when the machine spawned via `useProductConfig`. This
      // lets `applyConfigDefaults` and other one-shot helpers reach the
      // default cycle without having to synthesise a fake `Product`.
      context.lookups?.product?.defaultPaymentPeriod
    );
    required.push("term");
  }

  // --- options
  if (!isEmpty(context.lookups?.options)) {
    const invalidOptions = filter(
      context.lookups!.options!,
      (opt: SubproductDetails) =>
        hasError(`#/properties/options/properties/${opt.id}`)
    );
    if (!isEmpty(invalidOptions)) {
      properties.options = buildSubproductGroupSchema(invalidOptions);
    }
  }

  // --- attributes
  if (!isEmpty(context.lookups?.attributes)) {
    const invalidAttributes = filter(
      context.lookups!.attributes!,
      (attr: SubproductDetails) =>
        hasError(`#/properties/attributes/properties/${attr.id}`)
    );
    if (!isEmpty(invalidAttributes)) {
      properties.attributes = buildSubproductGroupSchema(invalidAttributes);
    }
  }

  // --- provision fields (parse raw fields into JSON schema)
  if (!isEmpty(context.lookups?.provisionFields) && context.rawProduct) {
    const invalidProvisionFields = filter(
      context.lookups!.provisionFields,
      (field: any) =>
        hasError(`#/properties/provisionFields/properties/${field.name}`)
    );
    if (!isEmpty(invalidProvisionFields)) {
      properties.provisionFields = parseProvisioningSchema(
        invalidProvisionFields,
        context.rawProduct
      );
    }
  }

  // --- trial opt-in
  if (
    context.lookups?.product?.trialSupported &&
    hasError("#/properties/startTrial")
  ) {
    properties.startTrial = buildTrialSchema(context.lookups.product);
  }

  if (isEmpty(properties)) return undefined;

  return {
    type: "object",
    required,
    properties
  } as JsonSchema7;
}
