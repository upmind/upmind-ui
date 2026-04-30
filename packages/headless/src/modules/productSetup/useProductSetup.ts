// --- external
import { computed, ref, shallowRef, watch } from "vue";
import {
  defaultsDeep,
  filter,
  find,
  first,
  get,
  includes,
  isEmpty,
  map,
  reduce,
  reject,
  size,
  some,
  values
} from "lodash-es";

// --- internal
import { useBasket } from "../basket";
import {
  useBasketProduct,
  useBasketProducts,
  type BasketProduct,
  type UseBasketProduct
} from "../basketProduct";
import basketProductServices from "../basketProduct/services";
import {
  useInvalidProductConfigSchema,
  useInvalidProductConfigUischema
} from "../product/schemas";

import { useConfig } from "../config";
import {
  compactDeep,
  contextValue,
  DetailedError,
  ErrorOrigin,
  isDeepEmpty,
  responseCodes,
  stateValue,
  useContext,
  useModelParser,
  type ErrorObject,
  type ResponseError
} from "../../utils";
import { basketProductRequiresSetup } from "./utils";

// --- types
import type { ActorRef } from "xstate";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import { UIContext } from "../config/schema/types";
import type { ProductConfigContext, ProductModel } from "../product/types";
import { useI18n } from "../system";

// -----------------------------------------------------------------------------
/**
 * @module productSetup/useProductSetup
 * @description Composable for the Product Setup flow. Provides context, meta, and
 * methods for guiding users through fixing invalid product configuration before
 * checkout. Shows ONE product at a time with only the fields that have errors.
 */

/**
 * Composable for the Product Setup flow.
 *
 * Exposes invalid products, filtered UISchema for the current product,
 * and an `apply` method to update provision fields with merge semantics.
 *
 * Respects `@context productSetup` config:
 * - `required` (default): only products with validation errors
 * - `deferred`: products with errors OR deferred fields with empty values
 */
export function useProductSetup() {
  const { products: basketProducts, isReady, meta: basketMeta } = useBasket();
  const { configure } = useBasketProducts();
  const { ui } = useConfig({ context: UIContext.CHECKOUT });

  // --- state
  // Current basket product ID being configured
  const bpid = ref<string>();
  const schema = ref<JsonSchema7>();
  const uischema = ref<UISchemaElement>();

  // Selected product IDs for "apply to similar" - user can toggle via checkboxes
  const selected = ref<string[]>([]);

  // True while an `apply()` call is in flight (used to drive the spinner / disable UI)
  const processing = ref(false);

  // Raw error captured from `apply()` — may be a single ResponseError or an array
  const rawError = ref<ResponseError | ResponseError[] | undefined>();

  // Normalised single ResponseError for UI consumption (mirrors basket/checkout pattern).
  // If the raw error is an array, join all messages so the UI can render `error?.message`
  // without having to know about the array shape.
  const error = computed<ResponseError | undefined>(() => {
    const e = rawError.value;
    if (!e) return undefined;
    if (!Array.isArray(e)) return e;
    return {
      ...(first(e) as ResponseError),
      message: map(e, "message").filter(Boolean).join("\n")
    };
  });

  // --- context
  const products = computed((): BasketProduct[] => {
    const mode = ui.productSetup.value;
    return filter(basketProducts.value, bp =>
      basketProductRequiresSetup(bp, mode)
    );
  });

  const total = computed(() => size(products.value));

  // Products with overlapping error paths (for "apply to similar")
  const similarProducts = computed((): BasketProduct[] => {
    if (!bpid.value) return [];

    const mode = ui.productSetup.value;
    const current = find(basketProducts.value, { id: bpid.value });
    if (!current) return [];

    // Get all error paths from current product
    const currentErrors = get(current, "errors", []) as ErrorObject[];
    const currentErrorPaths = map(currentErrors, "instancePath");

    if (isEmpty(currentErrorPaths)) return [];

    // Find other products requiring setup with any overlapping error paths
    return filter(basketProducts.value, bp => {
      if (bp.id === bpid.value) return false;
      if (bp.serviceIdentifier === current.serviceIdentifier) return false;
      if (!basketProductRequiresSetup(bp, mode)) return false;

      const bpErrors = get(bp, "errors", []) as ErrorObject[];
      return some(bpErrors, (e: ErrorObject) =>
        includes(currentErrorPaths, e.instancePath)
      );
    });
  });

  // --- meta
  const meta = computed(() => ({
    /** True when basket is loading. */
    isLoading: basketMeta.value.isLoading || isEmpty(schema.value),
    /** True when all products are complete (no products need setup). */
    isComplete: basketMeta.value.hasProducts && isEmpty(products.value),
    /** True when basket is available and there are products that need setup. */
    isAvailable: basketMeta.value.hasProducts && !isEmpty(products.value),
    /** True while an apply() call is in flight. */
    isProcessing: processing.value,
    /** True when the last apply() call errored. */
    hasError: !!error.value
  }));

  // --- methods
  /**
   * Apply the user's input from the current product's setup form to the
   * current product and any other selected "similar" products in one batch
   * call to `updateMany`.
   *
   * ## Why this is more nuanced than it looks
   *
   * `updateMany` is a REPLACE operation on the basket: whatever array of
   * basket products we send becomes the new basket. So we must:
   *
   * 1. **Include EVERY basket product** in the payload — even ones we
   *    aren't editing. Omitting a product would remove it from the basket.
   * 2. **Only mutate the configuration of target products** (the current
   *    one + any "apply to similar" selections). Other products pass
   *    through verbatim.
   * 3. **Limit non-current products to `provisionFields` only.** The
   *    current product receives the full delta (term, options, attributes,
   *    provisionFields, etc.), but propagating term/qty/options/attributes
   *    to other products would clobber their own settings — we only want
   *    to share the provision fields the user just filled in.
   *
   * ## Why we use `schema`
   *
   * The schema we parse `model` against is captured at `configure()` time,
   * BEFORE the user fills the form. By the time `apply()` runs, errors
   * are gone and the live `invalidSchema` is empty — which would let
   * unrelated fields leak through. The snapshot keeps the parser scoped
   * to "the fields that were actually broken when the user started".
   *
   * ## Merge semantics
   *
   * We use `defaultsDeep(compactDeep(existing), patch)` so existing values
   * win over the patch — `compactDeep` strips nullish/empty fields from
   * the existing config first, so the patch only fills holes rather than
   * overwriting good data.
   */
  function apply(model: Partial<ProductModel>): Promise<unknown> {
    const { basketId } = useBasket();

    // Parse user input against the schema snapshot taken at configure time.
    // This scopes the delta to only the fields that were originally invalid,
    // preventing accidental writes to unrelated configuration.
    const delta = schema.value
      ? useModelParser(schema.value, model, {}, { allowExtraProps: false })
      : {};

    // Bail ifdelta is empty (e.g., user hit "apply" without changing anything, or all errors were in fields they didn't touch)
    if (isDeepEmpty(delta)) {
      return Promise.resolve();
    }

    // Build the FULL basket products array. Non-target products are passed
    // through unchanged so updateMany doesn't drop them from the basket.
    const updatedProducts = reduce<BasketProduct, BasketProduct[]>(
      basketProducts.value,
      (acc, bp) => {
        // Pass through untouched — must still be in the payload.
        if (!includes([bpid.value, ...selected.value], bp.id)) {
          acc.push(bp);
          return acc;
        }

        // Current product: apply the entire delta (term, options, attrs, etc.)
        // Similar products: only share provisionFields — never term/qty/subproducts
        // which are product-specific and could/would be overwritten.
        const data =
          bp.id === bpid.value
            ? delta
            : { provisionFields: get(delta, "provisionFields", {}) };

        acc.push({
          ...bp,
          configuration: defaultsDeep(compactDeep(bp.configuration), data)
        });

        return acc;
      },
      []
    );

    processing.value = true;
    rawError.value = undefined;

    return basketProductServices
      .updateMany(basketId.value, updatedProducts, [])
      .catch(e => {
        rawError.value = e;
        throw e;
      })
      .finally(() => {
        processing.value = false;
        selected.value = [];
      });
  }

  function getNextInvalid(actor?: ActorRef<any>): BasketProduct | undefined {
    const pid = get(actor, "state.context.model.productId", {});
    return first(reject(products.value, ["productId", pid]));
  }

  function getNextRelated(actor: ActorRef<any>): BasketProduct | undefined {
    const provisionFields = contextValue<Record<string, any>>(
      actor,
      "model.provisionFields"
    );

    if (isEmpty(provisionFields)) return;

    return find(basketProducts.value, bp => {
      const serviceIdentifier = get(bp, "serviceIdentifier");
      if (!serviceIdentifier) return false;
      const value = includes(values(provisionFields), serviceIdentifier);
      const hasError = !isEmpty(get(bp, "errors"));
      return value && hasError;
    });
  }

  function getNextRequiringSetup(
    actor?: ActorRef<any>
  ): BasketProduct | undefined {
    return getNextRelated(actor!) || getNextInvalid(actor);
  }

  function resetselected(): void {
    selected.value = map(similarProducts.value, "id");
  }

  // Reads the live invalid schema/uischema off the config's service context
  // and stores the snapshots. Called at configure time AND whenever the
  // basket refreshes — e.g. after auth swaps the guest token, validation
  // re-runs and produces a fresh basketErrors we want to capture.
  function captureSchemas(service: ActorRef<any>): void {
    const ctx = contextValue<ProductConfigContext>(service)!;
    const basketErrors = contextValue<ProductConfigContext["basketErrors"]>(
      service,
      "basketErrors"
    );
    const state = service.getSnapshot()?.value;
    schema.value = useInvalidProductConfigSchema(ctx);
    uischema.value = useInvalidProductConfigUischema(ctx);
    console.log("captureSchemas", {
      state,
      ctx,
      basketErrors,
      schema: schema.value,
      uischema: uischema.value
    });
  }

  // --- side effects

  // Clean up stale selections when basket products change
  watch(basketProducts, () => {
    const validIds = map(similarProducts.value, "id");
    selected.value = filter(selected.value, id => includes(validIds, id));
  });

  // -----------------------------------------------------------------------------

  return {
    // --- context
    /** Configure a specific basket product for setup. Pass the bpid from route params. */
    configure: (id: BasketProduct["id"]) => {
      return isReady().then(() =>
        configure(id, {
          allowMultipleEdits: true
        })
          // .then(config => config.isReady().then(() => config))
          .then(config => {
            bpid.value = id;
            selected.value = map(similarProducts.value, "id");
            // captureSchemas(config.service);

            // lets ensure we can recover if we dont have schema at this point
            if (isEmpty(schema.value)) {
              let stop: (() => void) | undefined;
              stop = watch(
                config.meta,
                ({ isAvailable }) => {
                  if (isAvailable) {
                    stop?.(); // Optional chain: immediate:true runs before watch() returns
                    config.isReady().then(() => captureSchemas(config.service));
                  }
                },
                {
                  immediate: true,
                  deep: true
                }
              );
            }

            return config;
          })
      );
    },
    /** Subset schema containing only fields that need attention. Captured at configure time. */
    schema,
    /** Subset uischema containing only fields that need attention. Captured at configure time. */
    uischema,
    /** Last error from apply() — null until something fails. */
    error,
    /** All products requiring setup (invalid or deferred based on config mode). */
    products,
    /** Selected product IDs for "apply to others" - defaults to all products. */
    selected,
    /** Total count of products requiring setup. */
    total,
    // --- meta
    /** Meta flags: isLoading, isComplete, isAvailable, isProcessing, hasError. */
    meta,
    // --- methods
    /** Apply provision data to one or more products with merge semantics. */
    apply,
    /** Wait for the basket to be ready before checking product setup status. */
    isReady,
    /** Reset selected to all similar products (call on cancel/apply). */
    resetselected,
    /**
     * Get the next invalid product relative to a given basket product actor.
     * Excludes the actor's own product from results.
     */
    getNextInvalid,
    /**
     * Get a related product that has errors, relative to a given basket product actor.
     * Checks if the actor's provision fields reference another basket item's service identifier.
     * E.g., a hosting product references a domain - if that domain needs action, returns it
     * so you can route directly to fix it before resuming the normal flow.
     */
    getNextRelated,
    /**
     * Get the next product requiring setup relative to a given basket product actor.
     * Prioritizes related products (getNextRelated) over invalid ones (getNextInvalid).
     * Use as the primary navigation method for seamless related-product resolution.
     */
    getNextRequiringSetup,
    /** Products with overlapping missing provision fields (for "apply to similar"). */
    similarProducts
  };
}

export type UseProductSetup = ReturnType<typeof useProductSetup>;
