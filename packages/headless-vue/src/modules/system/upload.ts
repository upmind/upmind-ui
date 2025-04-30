// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
// import type { ImageObjectTypes } from "@upmind-automation/headless";
import { useSystemUpload } from "@upmind-automation/headless";

// --- utils
import { get, isEmpty } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

export const useUpload = (field: any) => {
  const upload = useSystemUpload(field);
  const { state, send } = useActor(upload.service);

  // ---
  const add = async (value: string) => {
    send({
      type: "ADD",
      data: value,
    });

    return waitFor(
      upload.service,
      state => ["processed", "error"].some(state.matches),
      { timeout: 60_000 }
    ).then(() => {
      if (state.value.matches("processed")) {
        const file = get(state.value, "context.file");
        return file;
      } else {
        // throw
        const error = get(state.value, "context.error");
        throw new Error(error);
      }
    });
  };

  const remove = () => {
    send({
      type: "REMOVE",
    });
  };

  const getImage = (type: any, typeId: any, isDefault: any) =>
    send({
      type: "LOAD",
      data: {
        type,
        typeId,
        isDefault,
      },
    });

  const getImageByHash = (hash: any) => {
    send({ type: "LOAD", data: { hash } });
  };

  // ---------------------------------------------------------------------------
  return {
    state: computed(() => state.value.value),
    // ---
    file: computed(() => state.value.context.file),
    name: computed(() => state.value.context.name),

    created: computed(() =>
      state.value.context?.response?.created_at
        ? new Date(`${state.value.context.response.created_at} Z`)
        : null
    ),

    src: computed(() => state.value.context.src),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: state.value.matches("loading"),
      isProcessing: ["checking", "processing"].some(state.value.matches),
      isComplete: ["processed", "complete"].some(state.value.matches),
      hasErrors: state.value.matches("error"),
      hasFile: !isEmpty(state.value.context?.file),
    })),
    // ---
    add,
    remove,
    getImage,
    getImageByHash,
    stop: upload.stop,
  };
};
