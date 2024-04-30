// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
// import type { ImageObjectTypes } from "@upmind/flow";
import { useI18n as useSystemI18n } from "@upmind/flow";

// --- utils
import { get, isEmpty } from "lodash-es";

// --- types

// --------------------------------------------------------
// a composable that provides a simple interface to the i18n machine
//  with some state helpers

export const useI18n = (activeLocale = "en") => {
  const i18n = useSystemI18n(activeLocale);
  const { state, send } = useActor(i18n.service);

  // --------------------------------------------------------

  const getLocale = async (path: string, locale?: string) => {
    send({
      type: "GET",
      data: { path, locale },
    });

    return new Promise((resolve, reject) => {
      waitFor(i18n.service, state => ["processed", "error"].some(state.matches))
        .then(() => {
          if (state.value.matches("processed")) {
            const messages = get(state.value, ["context", "messages", locale]);
            resolve(messages);
          } else {
            // throw
            const error = get(state.value, "context.error");
            reject(error);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    // ---
    activeLocale: computed(() => state.value.context.activeLocale),
    messages: computed(() => state.value.context?.messages),
    errors: computed(() => state.value.context?.error),
    // ---
    meta: computed(() => ({
      isLoading: state.value.matches("loading"),
      isProcessing: ["checking", "processing"].some(state.value.matches),
      isComplete: ["processed", "complete"].some(state.value.matches),
      hasErrors: state.value.matches("error"),
      hasMessages: !isEmpty(state.value.context?.messages),
    })),
    // ---
    getLocale,
    destroy: i18n.destroy,
  };
};
