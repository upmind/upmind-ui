import { set, isPlainObject, forEach } from "lodash-es";

/**
 * Expands an object that contains both regular properties and dot-notation string keys.
 * This utility recursively processes the object, expanding any keys containing dots into their
 * nested structure and merging them with existing nested properties.
 *
 * @param obj - Object with mixed notation (both nested and dot-notated keys)
 * @returns A new object with all dot-notation keys expanded and merged into the nested structure
 *
 * @example
 * const config = {
 *   cart: {
 *     uischema: {
 *       config: {
 *         header: "hidden"
 *       }
 *     },
 *     "uischema.config.breadcrumbs": "hidden"  // dot-notation key at the same level
 *   }
 * };
 *
 * parseFlattened(config);
 *
 * // Returns:
 * // {
 * //   cart: {
 * //     uischema: {
 * //       config: {
 * //         header: "hidden",
 * //         breadcrumbs: "hidden"  // merged into existing nested structure
 * //       }
 * //     }
 * //   }
 * // }
 */
export function parseFlattened<T = Record<string, any>>(
  obj?: Record<string, any>
): T {
  const result = {};

  // Iterate through each key in the object
  forEach(obj, (value, key) => {
    // Recursively process nested objects to handle dot-notation keys at any depth
    const expandedValue = isPlainObject(value) ? parseFlattened(value) : value;

    // Use lodash set to handle both regular keys and dot-notation keys
    // If key contains dots (e.g., "uischema.config.breadcrumbs"), set will expand it into nested structure
    set(result, key, expandedValue);
  });

  return result as T;
}
