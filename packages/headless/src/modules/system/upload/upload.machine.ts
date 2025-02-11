// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { UploadContext, UploadEvent } from "../types";

// --- utils
import { useTime, useValidationParser } from "../../../utils";
import { useFileParser, useFileSrcParser } from "./utils";

// --- types
// @ts-ignore
const base = import.meta.env.VITE_API_URL;

// --------------------------------------------------------

export default createMachine(
  {
    // @
    //tsTypes: {} as import("./upload.machine.typegen").Typegen0,
    id: "uploadManager",
    predictableActionArguments: true,
    initial: "idle",
    context: {
      field: {},

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
      // ---
      file: null,
      name: null,
      src: null,

      // ---
      error: null,
    } as UploadContext,
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
        request: (_context: UploadContext, { data }: UploadEvent) =>
          useFileParser(data),
        name: (_context: UploadContext, { data }: UploadEvent) => data?.name,
        src: (_context: UploadContext, { data }: UploadEvent) =>
          useFileSrcParser(data),
      }),

      setResponse: assign({
        response: ({ _context }: UploadContext, { data }: UploadEvent) => data,
        file: (_context: UploadContext, { data }: UploadEvent) => data.value,
        name: ({ name }: UploadContext, { data }: UploadEvent) =>
          data?.name || name,
        src: (_context: UploadContext, { data }: UploadEvent) =>
          `${base}/api/images/${data.value}/download`,
      }),

      setProgress: assign({
        progress: (_context: UploadContext, { data }: UploadEvent) => data,
      }),

      // ---
      setError: assign({
        error: (_context, { data }: any) => {
          // @
          let error = data?.error;
          // @
          if (errore.code == responseCodes.Unprocessable_Entity) {
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
