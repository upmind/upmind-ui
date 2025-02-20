// --- external
import { createMachine, assign, AnyEventObject } from "xstate";

// --- internal
import services from "./services";
import type { UploadContext } from "./types";

// --- utils
import { useTime, useValidationParser, responseCodes } from "../../../utils";
import { useFileParser, useFileSrcParser } from "./utils";

// --- types
const base = import.meta.env.VITE_API_URL;

// --------------------------------------------------------

export default createMachine(
  {
    // @
    //tsTypes: {} as import("./upload.machine.typegen").Typegen0,
    id: "uploadManager",
    predictableActionArguments: true,
    initial: "idle",
    context: {} as UploadContext,
    states: {
      idle: {
        on: {
          LOAD: { target: "loading" },
        },
      },

      loading: {
        entry: ["clearError"],
        invoke: {
          src: "getImage",
          onDone: {
            target: "processed",
            actions: ["setResponse"],
          },
          onError: {
            target: "error",
            actions: ["setError"],
          },
        },
      },

      checking: {
        entry: ["clearError"],
        invoke: {
          src: "check",
          onDone: {
            target: "processing",
          },
          onError: {
            target: "error",
            actions: ["setError"],
          },
        },
      },

      processing: {
        entry: ["clearError"],
        invoke: {
          src: "upload",
          onDone: {
            target: "processed",
            actions: ["setResponse"],
          },
          onError: {
            target: "error",
            actions: ["setError"],
          },
        },
        on: {
          PROGRESS: {
            actions: ["setProgress"],
          },
        },
      },

      processed: {
        after: {
          wait: {
            target: "complete",
          },
        },
      },

      complete: {
        // type: "final",
        on: {
          REMOVE: {
            target: "idle",
            actions: ["clear"],
          },
        },
      },

      error: {
        on: {
          RETRY: {
            target: "processing",
          },
        },
      },
    },
    on: {
      ADD: { target: "checking", actions: ["setRequest"] },
    },
  },
  {
    actions: {
      clear: assign({
        request: null,
        response: null,
        file: null,
        name: null,
        src: null,
        progress: 0,
      }),

      setRequest: assign({
        request: (_context: UploadContext, { data }: AnyEventObject) =>
          useFileParser(data),
        name: (_context: UploadContext, { data }: AnyEventObject) => data?.name,
        src: (_context: UploadContext, { data }: AnyEventObject) =>
          useFileSrcParser(data),
      }),

      setResponse: assign({
        response: (_context: UploadContext, { data }: AnyEventObject) => data,
        file: (_context: UploadContext, { data }: AnyEventObject) => data.value,
        name: ({ name }: UploadContext, { data }: AnyEventObject) =>
          data?.name || name,
        src: (_context: UploadContext, { data }: AnyEventObject) =>
          `${base}/api/images/${data.value}/download`,
      }),

      setProgress: assign({
        progress: (_context: UploadContext, { data }: AnyEventObject) => data,
      }),

      // ---
      setError: assign({
        error: (_context, { data }: any) => {
          // @
          let error = data?.error;
          // @
          if (error.code == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error;
        },
      }),

      clearError: assign({ error: null }),
    },
    guards: {},
    delays: {
      // @
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    // @
    services,
  }
);
