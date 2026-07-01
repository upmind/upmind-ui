import { type MaybeRef, toRaw, unref } from "vue";
import {
  get,
  find,
  every,
  isEmpty,
  includes,
  isString,
  isEqual,
  some
} from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * useCollection is a utility function that provides methods to interact with a collection of items.
 * It allows you to retrieve a single item by its ID or find an item based on a mapping or criteria.
 * It can be used with both reactive references and plain arrays. and individual methids can accept overrides for the data source.
 *
 * @param initial The initial collection of items, can be a reactive reference or a plain array.
 * @template T The type of items in the collection.
 * @returns
 */
export function useCollection<T = unknown>(
  initial: MaybeRef<T[] | null | undefined> = [] as T[]
) {
  // --- methods

  function getOne(
    id?: string | number,
    data: MaybeRef<T[] | null | undefined> = initial ?? []
  ) {
    data = unref(toRaw(data)) as T[];
    if (isEmpty(id)) return undefined;
    return find(data || [], ["id", id]);
  }

  function findOne(
    mapping: string | Partial<T>,
    data: MaybeRef<T[] | null | undefined> = initial ?? [],
    searchableProps: string[] = []
  ) {
    data = unref(toRaw(data)) as T[];

    if (isString(mapping)) {
      return find(data || [], (item: T) =>
        some(searchableProps, prop => {
          const value = get(item, prop, "");
          return (
            isString(value) &&
            includes(value.toLowerCase(), mapping.toLowerCase())
          );
        })
      );
    }

    return find(data || [], item =>
      every(mapping, (value, key) => {
        if (key == "id") return get(item, "id") == value;
        const modelValue = get(item, key);
        return isEqual(modelValue, value);
      })
    );
  }

  function getDefault(data: MaybeRef<T[] | null | undefined> = initial ?? []) {
    data = unref(toRaw(data)) as T[];
    return find(data || [], "meta.isDefault") as T | undefined;
  }

  // ---------------------------------------------------------------------------

  return {
    getOne,
    findOne,
    getDefault
  };
}
