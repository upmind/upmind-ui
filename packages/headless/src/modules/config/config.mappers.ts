/** @internal */
import { isConditionalValue } from "./config.conditions";
import {
  SCOPE_ORDER,
  type MetaItems,
  type ScopeItems,
  type PropertyDefinition
} from "./config.types";
import {
  UIContext,
  UIScope,
  UI_META_DEFINITIONS,
  DATA_DEFINITIONS
} from "./schema";
import {
  get,
  includes,
  values,
  isNil,
  minBy,
  isFinite,
  isNumber,
  isString,
  first
} from "lodash-es";
import type { UIMetaSchema as UISchema, DataSchema } from "./schema";

/** Get value for a scope from input items */
export function getScopeValue(
  scope: UIScope,
  property: string,
  input: ScopeItems
) {
  const data = {
    [UIScope.OPTION]: input.option,
    [UIScope.OPTION_CATEGORY]: input.optionGroup,
    [UIScope.PRODUCT]: input.product,
    [UIScope.PRODUCT_CATEGORY]: input.category,
    [UIScope.BRAND]: input.brand
  }[scope];

  return get(data, property);
}

/** Gets a property value by cascading through scopes. */
function getPropertyValue(
  property: string,
  definition: PropertyDefinition,
  input: ScopeItems
) {
  // Context check - return undefined if property doesn't apply to this context
  // (skipped when no context - returns wildcard values only)
  if (input.context && input.context !== UIContext.ALL) {
    if (!includes(definition.contexts, input.context)) return undefined;
    // Lock check - return locked value if property is locked in this context (UI only)
    if (definition.locked && input.context in definition.locked) {
      return definition.locked[input.context];
    }
  }

  // Scope cascade - check scopes from highest to lowest priority
  for (const scope of SCOPE_ORDER) {
    if (!includes(definition.scopes, scope)) continue;

    const value = getScopeValue(scope, property, input);
    // Value validation - ensure value matches type definition, fallback to default if invalid
    if (!isNil(value) && value !== "") {
      // If value is conditional, return raw - let proxy layer evaluate and normalize
      if (isConditionalValue(value)) {
        return value;
      }
      return normalizeValue(value, definition.type) ?? definition.default;
    }
  }

  return definition.default;
}

/**
 * Resolves the effective value of a UI meta property
 * Cascades from most specific scope (option) to least specific (brand),
 * returning the first defined value that passes context and lock checks.
 */
export function getUIProperty(
  property: keyof UISchema,
  input: MetaItems
): UISchema[keyof UISchema] | undefined {
  return getPropertyValue(property, UI_META_DEFINITIONS[property], input) as
    | UISchema[keyof UISchema]
    | undefined;
}

/**
 * Resolves the effective value of a data meta property.
 * Cascades from most specific scope (option) to least specific (brand).
 * returning the first defined value that passes context and lock checks.
 */
export function getDataProperty(
  property: keyof DataSchema,
  input: ScopeItems
): DataSchema[keyof DataSchema] | undefined {
  return getPropertyValue(property, DATA_DEFINITIONS[property], input) as
    | DataSchema[keyof DataSchema]
    | undefined;
}

/**
 * Checks if a UI property applies to the given context.
 */
export function isApplicable(
  property: keyof UISchema,
  context: UIContext
): boolean {
  const definition = UI_META_DEFINITIONS[property];
  if (!definition) return false;
  return includes(definition.contexts, context);
}

/**
 * Normalizes a value to the nearest valid value for the given type.
 * Only adjusts numeric types where all values share the same suffix.
 *
 * Works with: GRID_LAYOUT, CATEGORY_GRID_LAYOUT, CLAMP_LINES, GATEWAY_CAP
 *
 * e.g., "9-col" with valid ["2-col", "3-col", "4-col"] → "4-col"
 */
export function normalizeValue(
  value: unknown,
  type?: Record<string, string>
): string | undefined {
  // No type constraint
  if (!type) return value as string;

  if (isNumber(value)) {
    value = String(value);
  }

  const validValues = values(type);

  // Already valid
  if (includes(validValues, value)) return value as string;
  if (!isString(value)) return undefined;

  const toNum = (s: string) => parseInt(s, 10);
  const getSuffix = (s: string) => s.replace(/^\d+/, "");

  // Filter to valid values that contain leading numbers
  const numericValues = validValues.filter(v => isFinite(toNum(v)));
  if (!numericValues.length) return undefined;

  // Only normalize if all numeric values share the same suffix
  // e.g., ["1-col", "2-col"] ✓ but ["1:1", "16:9"] ✗
  const suffixes = numericValues.map(getSuffix);
  if (!suffixes.every(s => s === first(suffixes))) return undefined;

  // Check input has the same suffix
  const inputSuffix = getSuffix(value);
  if (inputSuffix !== first(suffixes)) return undefined;

  // Find the closest by numeric distance
  const inputNum = toNum(value);
  return minBy(numericValues, v => Math.abs(toNum(v) - inputNum));
}
