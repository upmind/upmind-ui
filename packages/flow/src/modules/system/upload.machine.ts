// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services.upload";
import type { UploadContext, UploadEvent } from "./types.d";

// --- utils
import { useTime, useValidationParser } from "../../utils";
import { useFileParser, useFileSrcParser } from "./utils";

// --- types

const base = import.meta.env.VITE_API_URL;

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./upload.machine.typegen").Typegen0,
    id: "uploadManager",
    predictableActionArguments: true,
    initial: "idle",
    context: {
      fileTypeId: null,
      fileType: null,
      isDefault: false,

      // ---
      fileTypes: [],
      // maxFileSize: 0,
      // minFileSize: 0,
      // minDimensions: {
      //   width: 0,
      //   height: 0
      // },
      // maxDimensions: {
      //   width: 0,
      //   height: 0
      // },

      // ---
      progress: 0,
      request: null,
      response: null,
      file: null,
      src: null,

      // ---
      error: null
    } as UploadContext,
    states: {
      idle: {
        on: {
          LOAD: { target: "loading" },
          ADD: { target: "checking" }
        }
      },

      loading: {
        entry: ["clearError"],
        invoke: {
          src: "getImage",
          onDone: {
            target: "processed",
            actions: ["setResponse"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

      checking: {
        entry: ["clearError"],
        invoke: {
          src: "check",
          onDone: {
            target: "processing",
            actions: ["setRequest"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

      processing: {
        entry: ["clearError"],
        invoke: {
          src: "upload",
          onDone: {
            target: "processed",
            actions: ["setResponse"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        },
        on: {
          PROGRESS: {
            actions: ["setProgress"]
          }
        }
      },

      processed: {
        after: {
          wait: {
            target: "complete"
          }
        }
      },

      complete: {
        // type: "final",
        on: {
          REMOVE: {
            target: "idle",
            actions: ["clear"]
          }
        }
      },

      error: {
        on: {
          RETRY: {
            target: "processing"
          }
        }
      }
    }
  },
  {
    actions: {
      clear: assign({
        file: null,
        src: null,
        progress: 0
      }),

      setRequest: assign({
        request: (_context: UploadContext, { data }: UploadEvent) =>
          useFileParser(data),
        src: (_context: UploadContext, { data }: UploadEvent) =>
          useFileSrcParser(data)
      }),

      setResponse: assign({
        response: (_context: UploadContext, { data }: UploadEvent) => data,
        file: (_context: UploadContext, { data }: UploadEvent) => data.value,
        src: (_context: UploadContext, { data }: UploadEvent) =>
          `${base}/api/images/${data.value}/download`
      }),

      setProgress: assign({
        progress: (_context: UploadContext, { data }: UploadEvent) => data
      }),

      // ---
      setError: assign({
        error: (context, { data }, meta) => {
          console.log("setError", data, meta);

          let error = data?.error;
          if (error?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error;
        }
      }),

      clearError: assign({ error: null })
    },
    guards: {},
    delays: {
      wait: () => useTime().MILLISECOND * 100 // this allows us to wait for a imperceptible amount of time before continuing
    },
    services
  }
);
