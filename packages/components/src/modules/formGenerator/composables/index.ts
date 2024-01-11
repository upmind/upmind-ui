// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useSystemUpload } from "@upmind/flow";

// --- utils
import { get, isEmpty } from "lodash-es";

// --- types

// --------------------------------------------------------
// a composable that provides a simple interface to the uploads machine
//  with some state helpers

export const useUpload = () => {
  const upload = useSystemUpload();
  const { state, send } = useActor(upload.service);

  // --------------------------------------------------------

  const add = async (value: string) => {
    send({
      type: "ADD",
      data: value
    });

    return new Promise((resolve, reject) => {
      waitFor(upload.service, state =>
        ["processed", "error"].some(state.matches)
      )
        .then(() => {
          if (state.value.matches("processed")) {
            const file = get(state.value, "context.file");
            resolve(file);
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

  const remove = (value: string) => {
    send({
      type: "REMOVE",
      data: value
    });
  };

  const getImage = (imageType, typeId, isDefault) =>
    send({
      type: "LOAD",
      data: {
        imageType,
        typeId,
        isDefault
      }
    });
  const getImageByHash = hash => send({ type: "LOAD", data: { hash } });

  // --------------------------------------------------------

  return {
    state: computed(() => state.value.value),
    // ---
    file: computed(() => state.value.context.file),
    fileTypes: computed(() => state.value.context.fileTypes),
    hash: computed(() => state.value.context.hash),
    src: computed(() => state.value.context.src),
    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),
    // ---
    meta: computed(() => ({
      isLoading: state.value.matches("loading"),
      isProcessing: ["checking", "processing"].some(state.value.matches),
      isComplete: ["processed", "complete"].some(state.value.matches),
      hasErrors: state.value.matches("error"),
      hasFile: !isEmpty(state.value.context?.file)
    })),
    // ---
    add,
    remove,
    getImage,
    getImageByHash,
    destroy: upload.destroy
  };
};
