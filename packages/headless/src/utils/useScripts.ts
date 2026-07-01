import { Store } from "@tanstack/vue-store";
import { computed } from "vue";
import { DetailedError, ErrorOrigin, responseCodes } from "./useError";
import { first, has, isFunction, omit, set } from "lodash-es";

// --- types

export interface Scripts {
  errored: Record<string, boolean>;
  loaded: Record<string, string>;
  loading: Record<string, Promise<void>>;
}
// -----------------------------------------------------------------------------

const loadingStore = new Store<Scripts["loading"]>({});
const erroredStore = new Store<Scripts["errored"]>({});
const loadedStore = new Store<Scripts["loaded"]>({});

// -----------------------------------------------------------------------------

export const useScripts = () => {
  async function load(
    key: string,
    src: string | URL,
    {
      async,
      prepend,
      onError,
      onSuccess
    }: {
      onSuccess?: (...args: unknown[]) => unknown;
      onError?: (...args: unknown[]) => unknown;
      async?: boolean;
      prepend?: boolean;
    } = { async: true }
  ) {
    const loading = loadingStore.state;
    const errored = erroredStore.state;
    const loaded = loadedStore.state;

    if (has(loading, key)) return loading[key]; // the current loading promise
    if (has(errored, key))
      return Promise.reject(
        new DetailedError(
          "Script failed to load",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless,
          { script: key }
        )
      );
    if (has(loaded, key)) return Promise.resolve();

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.id = key;
      script.setAttribute("src", src.toString());

      if (async) script.async = true;

      script.addEventListener("error", async () => {
        erroredStore.setState(values => {
          set(values, key, true);
          return values;
        });
        if (isFunction(onError)) await onError();
        return reject(
          new DetailedError(
            "Script failed to load",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless,
            { script: key }
          )
        );
      });

      script.addEventListener("load", async () => {
        loadedStore.setState(values => {
          set(values, key, src);
          return values;
        });
        if (isFunction(onSuccess)) await onSuccess();
        return resolve();
      });

      const firstScript = prepend
        ? first(document.getElementsByTagName("script"))
        : undefined;

      firstScript?.parentNode
        ? firstScript.parentNode.insertBefore(script, firstScript)
        : document.head.appendChild(script);
    }).finally(() => loadingStore.setState(values => omit(values, key)));

    loadingStore.setState(values => {
      set(values, key, promise);
      return values;
    });

    return promise;
  }

  return {
    load,
    loading: computed(() => loadingStore.state),
    loaded: computed(() => loadedStore.state),
    errored: computed(() => erroredStore.state)
  };
};
