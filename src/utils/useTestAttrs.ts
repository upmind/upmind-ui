import { castArray, find, get, isEmpty, omit, pull, unset } from "lodash-es";
import { useAttrs, type HTMLAttributes } from "vue";

type TestAttrsOptions = {
  key: string;
  value?: (string | unknown) | (string | unknown)[]; // cascade values, in priority order
  dataAttrs?: Record<string, string | unknown>; // defined bag of data attributes
};

/**
 * A utility function to generate test attributes for components, primarily for testing purposes.
 * It checks for the presence of a key and value, either directly or through a legacy dataAttrs bag.
 * If the environment is production, it returns an empty object to avoid adding test attributes in production builds.
 *
 * @param input - An object containing optional key, value, dataAttrs, and fallbacks for generating test attributes.
 * @returns An object containing the generated test attributes (data-test-key and data-test-value) or an empty object in production.
 *
 */
export function useTestAttrs(input: TestAttrsOptions) {
  // NB : This function is designed to be used in a development or testing environment.
  //      In production builds, it returns an empty object to avoid adding test attributes
  //      that are not needed and could potentially expose internal implementation details.

  // NB : The useAttrs() function is used to access the attributes passed to the component.
  //      It is cast to HTMLAttributes to ensure type safety and to allow for the retrieval of specific attributes.
  //      The "data-test-key" and "data-test-value" attributes are extracted from the component's attributes,
  //      allowing for the possibility of overriding the default key and value provided in the input.
  //      We also merge any defined data attributes provided in the input.dataAttrs into the attrs object to ensure backward compatibility.
  const attrs = { ...useAttrs(), ...(input.dataAttrs ?? {}) } as HTMLAttributes;

  // pluck the "data-test-key" and "data-test-value" attributes from the attrs object to avoid duplication in the returned object.
  const overrideKey = get(attrs, "data-test-key");
  unset(attrs, "data-test-key");
  const overrideValue = get(attrs, "data-test-value");
  unset(attrs, "data-test-value");

  if (import.meta.env.PROD) return attrs; // Return an empty object in production

  const testAttrs: Record<string, string | undefined> = {
    "data-test-key": overrideKey || input.key,
    "data-test-value": (overrideValue ||
      find(castArray(input.value), v => !isEmpty(v))) as string | undefined
  };

  return { ...attrs, ...testAttrs };
}
