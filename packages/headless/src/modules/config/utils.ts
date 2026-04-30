// --- internal
import { useI18n } from "../system/localisation";

// -- utils
import { getUIProperty, getDataProperty, normalizeValue } from "./mappers";
import { isConditionalValue, evaluateRules } from "./config.conditions";
import {
  camelCase,
  compact,
  find,
  get,
  indexOf,
  isPlainObject,
  isString,
  keyBy,
  map,
  mapValues,
  sortBy,
  startsWith,
  trim
} from "lodash-es";

// --- types
import {
  computed,
  inject,
  provide,
  reactive,
  type ComputedRef,
  type Ref
} from "vue";
import type { UIMetaSchema as UISchema, DataSchema } from "./schema";
import { UIContext, UI_META_DEFINITIONS, DATA_DEFINITIONS } from "./schema";
import type {
  Viewport,
  RawMeta,
  MetaInput,
  UIMetaProxy,
  DataProxy,
  MetaPrefix,
  DataItems,
  MetaItems,
  UseMetaResult,
  ConditionState
} from "./types";
import { CONFIG_KEY, VIEWPORT_ORDER, META_PREFIX } from "./types";
import {
  VISIBILITY,
  CLAMPABLE_VISIBILITY,
  DESCRIPTION_DISPLAY,
  EDITABILITY,
  TAXES_DISPLAY,
  BREADCRUMBS,
  ZERO_PRICE_DISPLAY,
  TERM_SELECTOR,
  GRID_LAYOUT,
  CATEGORY_GRID_LAYOUT,
  GATEWAY_CAP,
  CLAMP_LINES,
  IMAGES_STYLE
} from "./schema";

// --- Initialization ---

/**
 * Initializes both UI meta and data items from raw meta at each scope level.
 * Parses raw API data into typed scope items for the resolution engine.
 */
export function initializeMeta(options: MetaInput): {
  meta: MetaItems;
  data: DataItems;
} {
  const { context, viewport, brand, category, product, optionGroup, option } =
    options;

  const parse = (raw: RawMeta | undefined, prefix: MetaPrefix) =>
    parseMeta(raw, prefix, context, viewport);

  const build = (prefix: MetaPrefix) => ({
    context,
    brand: parse(brand, prefix),
    category: parse(category?.uiMeta, prefix),
    product: parse(product?.productDetails?.uiMeta, prefix),
    optionGroup: parse(optionGroup?.uiMeta, prefix),
    option: parse(option?.uiMeta, prefix)
  });

  return {
    meta: build(META_PREFIX.CONTEXT) as MetaItems,
    data: build(META_PREFIX.DATA) as DataItems
  };
}

// --- Proxy Creation ---

/**
 * Creates a reactive proxy for UI meta properties.
 *
 * Each property becomes an object with multiple sub-properties:
 * - `value`: the resolved value after scope cascade
 * - Helper booleans based on type (e.g., visibility → isVisible, isHidden)
 *
 * Why reactive() per property?
 * - Each property is an OBJECT containing { value, ...helpers }
 * - Wrapping each in reactive() auto-unwraps computed refs in templates
 * - Allows usage like `ui.breadcrumbs.isHidden` instead of `ui.breadcrumbs.isHidden.value`
 *
 * Template usage: `ui.breadcrumbs.isHidden`, `ui.productDescription.value`
 */
export function createUIMetaProxy(
  metaItems: Ref<MetaItems>,
  conditionState?: Ref<ConditionState>
): UIMetaProxy {
  const results = mapValues(UI_META_DEFINITIONS, (definition, key) => {
    // Resolves value by cascading through scopes (option → product → category → brand)
    const rawValue = computed(() =>
      getUIProperty(key as keyof UISchema, metaItems.value)
    );

    // For conditional settings, evaluate rules against state then normalize
    const isConditional = "conditional" in definition && definition.conditional;
    const defType = "type" in definition ? definition.type : undefined;

    const value = isConditional
      ? computed(() => {
          const evaluated = evaluateRules(
            rawValue.value,
            conditionState?.value ?? {}
          );
          return normalizeValue(evaluated, defType) ?? definition.default;
        })
      : rawValue;

    // Find helper for this type (e.g., visibility gets isVisible/isHidden)
    const helper = defType ? find(HELPERS, { type: defType }) : undefined;

    // Each property is individually wrapped in reactive() because it's an object
    // containing both the value and helper methods (e.g., { value, isVisible, isHidden })
    return reactive({
      value,
      ...helper?.create(value as Ref<string | undefined>)
    });
  });

  return results as unknown as UIMetaProxy;
}

/**
 * Creates a reactive proxy for data meta properties.
 *
 * Each property is a direct computed value (no helpers needed)
 * - Unlike UI meta, these are simple key-value pairs
 * - No additional helper methods like isVisible/isHidden
 *
 * Why reactive() on the whole object?
 * - Each property is a DIRECT computed value, not an object
 * - Wrapping the entire result in reactive() auto-unwraps all computed refs
 * - Allows usage like `data.productName` instead of `data.productName.value`
 *
 * Template usage: `data.productName`, `data.categoryName`
 */
export function createDataProxy(
  dataItems: Ref<DataItems>,
  source?: Ref<Record<string, any> | undefined>
): DataProxy {
  // Each property is a direct computed value (not an object with sub-properties)
  const results = mapValues(DATA_DEFINITIONS, (_def, key) => {
    return computed(() => {
      const value = getDataProperty(key as keyof DataSchema, dataItems.value);
      return resolveDataValue(key, value, source?.value);
    });
  });

  // Wrap the entire results object in reactive() because each property
  // is a simple computed (not an object), creating a flat reactive map
  return reactive(results) as unknown as DataProxy;
}

// --- Meta Key Parsing ---

/**
 * Parses raw meta object for a given prefix (@context or @data).
 *
 * Transforms raw meta keys into schema properties:
 * 1. Parse each key, extracting property name and priority
 * 2. Remove non-matching keys (wrong prefix, context, or viewport)
 * 3. Sort by priority (higher priority values override lower)
 * 4. Group by property name (later entries win due to sort)
 *
 * Priority: context-specific > wildcard, viewport-specific > base
 */
function parseMeta(
  raw: Record<string, unknown> | undefined | null,
  prefix: MetaPrefix,
  context: UIContext | undefined,
  viewport?: Viewport
): Record<string, unknown> {
  if (!raw || !isPlainObject(raw)) return {};

  const mapped = map(raw, (value, key) => {
    const parsed = parseMetaKey(key, prefix, context, viewport);
    if (!parsed) return null;
    return { property: parsed.property, priority: parsed.priority, value };
  });
  const compacted = compact(mapped);
  const sorted = sortBy(compacted, "priority");
  const keys = keyBy(sorted, "property");
  return mapValues(keys, "value");
}

/**
 * Extracts property name and priority from a meta key.
 *
 * Key formats:
 * - `@prefix.property` or @prefix.*.property` → wildcard (applies to all contexts)
 * - `@prefix.scope.property` → context-specific
 * - Both support viewport suffix: `@prefix.property/lg`
 *
 * Returns null if key doesn't match prefix, context, or viewport.
 */
function parseMetaKey(
  key: string,
  prefix: MetaPrefix,
  context: UIContext | undefined,
  currentViewport?: Viewport
): { property: string; priority: number } | null {
  // Match: @prefix.[scope.]property[/viewport]
  const pattern = new RegExp(
    `^${prefix}\\.(?:(\\*|[^.]+)\\.)?([^/]+)(?:\\/(\\w+))?$`
  );
  const match = key.match(pattern);
  if (!match) return null;

  const scope = get(match, 1, "*");
  const property = get(match, 2);
  const viewport = get(match, 3);

  // Context matching: wildcard only when no context or *, otherwise must match
  if (!context || context === UIContext.ALL) {
    if (scope !== "*") return null;
  } else if (scope !== "*" && scope !== context) {
    return null;
  }

  // Viewport: "at least" semantics (/md matches md or lg)
  if (viewport && !viewportMatches(currentViewport, viewport)) return null;

  // Priority: context > wildcard, specific viewport > broad viewport
  const PRIORITY: Record<string, Record<string, number>> = {
    "*": { all: 1, sm: 2, md: 3, lg: 4 },
    context: { all: 5, sm: 6, md: 7, lg: 8 }
  };

  const scopeKey = scope === "*" ? "*" : "context";
  const viewportKey = (viewport as Viewport) ?? "all";

  return { property, priority: PRIORITY[scopeKey][viewportKey] };
}

/**
 * Check if current viewport meets the minimum required viewport.
 * Mobile-first: /sm matches all, /md matches md+lg, /lg matches lg only
 */
function viewportMatches(
  current: Viewport | undefined,
  required: string
): boolean {
  const currentPosition = indexOf(VIEWPORT_ORDER, current);
  const requiredPosition = indexOf(VIEWPORT_ORDER, required);
  return currentPosition >= requiredPosition && requiredPosition !== -1;
}

// --- Data Value Helpers ---

/** Keys that support template variable interpolation (e.g., {{ name }}, {{ service_identifier }}) */
const INTERPOLATABLE_KEYS = [
  "productName",
  "seoTitle",
  "seoDescription",
  "seoCanonical",
  "seoOgTitle",
  "seoOgDescription",
  "seoOgImage",
  "seoTwitterTitle",
  "seoTwitterDescription",
  "seoTwitterImage"
] as const;

/** Resolves special data values (e.g., productName with variable interpolation, i18n: references) */
function resolveDataValue(
  key: string,
  value: unknown,
  source?: Record<string, any>
): unknown {
  // Handle i18n: prefixed values
  // Example: "i18n:cart.store_heading" → resolves to the translated value
  if (isString(value) && startsWith(value, "i18n:")) {
    const i18nKey = value.substring(5); // Remove "i18n:" prefix
    const { t } = useI18n();
    return t(i18nKey);
  }

  // Handle keys with variable interpolation (productName, SEO properties, etc.)
  if (
    INTERPOLATABLE_KEYS.includes(key as (typeof INTERPOLATABLE_KEYS)[number])
  ) {
    return replaceDataVariables(value as string, source);
  }

  return value;
}

/**
 * Interpolates template variables with values from data object.
 * e.g., "{{ name }} - {{ service_identifier }}" → "Product - abc123"
 * Missing variables and orphaned braces are removed.
 */
export function replaceDataVariables(
  template: string | undefined,
  data: Record<string, any> | undefined
): string | undefined {
  if (!template || !data) return template;

  const result = template
    // Replace {{ variable }} with resolved values
    // Pattern matches: {{ name }}, {{email}}, {{ user.profile.name }}
    // Captures the variable path (everything between {{ and }})
    .replace(
      /\{\{\s*([^}]+)\s*\}\}/g,
      (_match, path) => resolveValue(path, data) || ""
    )
    // Remove orphaned braces from start/end of the string
    // Cleans up leftover braces when variables couldn't be resolved
    // e.g., "{ John Doe }" → "John Doe", "Name: {}" → "Name:"
    .replace(/^\s*[{}]+\s*|\s*[{}]+\s*$/g, "");

  return trim(result) || undefined;
}

/**
 * Resolves a value from data object.
 * Tries: direct path → productDetails → camelCase variants
 */
function resolveValue(
  path: string,
  data: Record<string, any>
): string | undefined {
  const key = trim(path);
  const paths = [key, `productDetails.${key}`];

  // Also try camelCase for snake_case keys
  if (key.includes("_")) {
    const camelKey = camelCase(key);
    paths.push(camelKey, `productDetails.${camelKey}`);
  }

  for (const p of paths) {
    const value = get(data, p);
    if (value != null) return String(value);
  }

  return undefined;
}

// --- Value Parsing ---

/**
 * Extracts leading numeric value from a string.
 * e.g., "2-col" → 2, "3" → 3, "none" → undefined
 */
export function parseNumericValue(
  value: string | undefined
): number | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Helper definitions produce reactive computed properties for each value type.
 *
 * For example, a Visibility property gets `.isVisible` and `.isHidden` helpers.
 * These are attached to each property result in the UIMetaProxy.
 * The proxy is wrapped in reactive() so computed refs auto-unwrap in templates.
 */

const visibility = {
  type: VISIBILITY,
  create: (v: Ref<string | undefined>) => ({
    isVisible: computed(() => v.value === "visible"),
    isHidden: computed(() => v.value === "hidden")
  })
};

const clampable = {
  type: CLAMPABLE_VISIBILITY,
  create: (v: Ref<string | undefined>) => ({
    isVisible: computed(() => v.value !== "hidden"),
    isHidden: computed(() => v.value === "hidden"),
    isClamped: computed(() => v.value === "clamped")
  })
};

const description = {
  type: DESCRIPTION_DISPLAY,
  create: (v: Ref<string | undefined>) => ({
    isTooltip: computed(() => v.value === "tooltip"),
    isInline: computed(() => v.value === "inline"),
    isHidden: computed(() => v.value === "hidden")
  })
};

const editability = {
  type: EDITABILITY,
  create: (v: Ref<string | undefined>) => ({
    isReadonly: computed(() => v.value === "readonly"),
    isEditable: computed(() => v.value === "editable")
  })
};

const taxes = {
  type: TAXES_DISPLAY,
  create: (v: Ref<string | undefined>) => ({
    isConsolidated: computed(() => v.value === "consolidated"),
    isVisible: computed(
      () => v.value === "consolidated" || v.value === "visible"
    )
  })
};

const breadcrumbs = {
  type: BREADCRUMBS,
  create: (v: Ref<string | undefined>) => ({
    isHidden: computed(() => v.value === "hidden"),
    isVisible: computed(() => v.value !== "hidden")
  })
};

const zeroPrice = {
  type: ZERO_PRICE_DISPLAY,
  create: (v: Ref<string | undefined>) => ({
    isNumeric: computed(() => v.value === "numeric"),
    isLabel: computed(() => v.value === "label")
  })
};

const termSelector = {
  type: TERM_SELECTOR,
  create: (v: Ref<string | undefined>) => ({
    isRadioGrid: computed(() => v.value === "radio-grid"),
    isRadioRows: computed(() => v.value === "radio-rows"),
    isSelect: computed(() => v.value === "select")
  })
};

const gridLayout = {
  type: GRID_LAYOUT,
  create: (v: Ref<string | undefined>) => ({
    asNumber: computed(() => parseNumericValue(v.value))
  })
};

const categoryGridLayout = {
  type: CATEGORY_GRID_LAYOUT,
  create: (v: Ref<string | undefined>) => ({
    asNumber: computed(() => parseNumericValue(v.value))
  })
};

const gatewayCap = {
  type: GATEWAY_CAP,
  create: (v: Ref<string | undefined>) => ({
    asNumber: computed(() => parseNumericValue(v.value)),
    isNone: computed(() => v.value === "none")
  })
};

const clampLines = {
  type: CLAMP_LINES,
  create: (v: Ref<string | undefined>) => ({
    asNumber: computed(() => parseNumericValue(v.value))
  })
};

const imagesStyle = {
  type: IMAGES_STYLE,
  create: (v: Ref<string | undefined>) => ({
    isAuto: computed(() => v.value === IMAGES_STYLE.AUTO),
    isSingle: computed(() => v.value === IMAGES_STYLE.SINGLE),
    isCarousel: computed(() => v.value === IMAGES_STYLE.CAROUSEL),
    isGrid: computed(() => v.value === IMAGES_STYLE.GRID)
  })
};

export const HELPERS = [
  visibility,
  clampable,
  description,
  editability,
  taxes,
  breadcrumbs,
  zeroPrice,
  termSelector,
  gridLayout,
  categoryGridLayout,
  gatewayCap,
  clampLines,
  imagesStyle
] as const;

export function provideConfig(config: UseMetaResult): void {
  provide(CONFIG_KEY, config);
}

export function injectConfig(): UseMetaResult | undefined {
  return inject(CONFIG_KEY, undefined);
}

/**
 * Creates a computed ref that caches the last truthy value.
 * When the source becomes undefined/null, returns the cached value instead.
 */
export function useCachedRef<T>(
  source: ComputedRef<T | undefined>
): ComputedRef<T | undefined> {
  let cache: T | undefined;
  return computed(() => {
    const current = source.value;
    if (current) cache = current;
    return current ?? cache;
  });
}
