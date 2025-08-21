// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";
import { interpret, InterpreterStatus } from "xstate";

// --- internal
import uploadMachine from "./upload.machine";

// --- utils
import {
  stopService,
  useState,
  useContext,
  stateMatches,
  contextMatches,
  DetailedError,
  responseCodes
} from "../../../utils";
import { get, isEmpty } from "lodash-es";

// --- types
import type { InterpreterFrom } from "xstate";

// -----------------------------------------------------------------------------

// system uploads is NOT a global insance, and is always instantiated as a new machine
// this is because we need to be able to have multiple uploads happening at once
// and we need to be able to start and stop them individually

export const useUpload = (field?: object) => {
  const context = {
    field
  };

  const service = interpret(uploadMachine.withContext(context as any), {
    devTools: false
  }).start();

  const { state, send } = useActor(service);

  // --- state

  const meta = computed(() => ({
    isLoading: stateMatches(state, "loading"),
    isProcessing: stateMatches(state, ["checking", "processing"]),
    isComplete: stateMatches(state, ["processed", "complete"]),
    hasErrors: stateMatches(state, "error"),
    hasFile: contextMatches(state, "file")
  }));
  // --- context
  const file = useContext(state, "file");
  const name = useContext(state, "name");
  const created = useContext(state, "response.created_at", (value: string) =>
    value ? new Date(`${value} Z`) : null
  );
  const src = useContext(state, "src");
  const errors = useContext(state, "error");

  // --- methods
  const add = async (value: string) => {
    send({
      type: "ADD",
      data: value
    });
    return waitFor(
      service,
      state => ["processed", "error"].some(state.matches),
      { timeout: 60_000 }
    )
      .then(() => {
        if (state.value.matches("processed")) {
          return file.value;
        } else {
          throw errors.value;
        }
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            error?.message ?? `Fetch Upload failed`,
            error?.type ?? responseCodes.Timeout,
            error
          )
        );
      });
  };

  const remove = () => {
    send({
      type: "REMOVE"
    });
  };

  const getImage = (type: any, typeId: any, isDefault: any) =>
    send({
      type: "LOAD",
      data: {
        type,
        typeId,
        isDefault
      }
    });

  const getImageByHash = (hash: any) => {
    send({ type: "LOAD", data: { hash } });
  };

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Meta information about the upload state.
     * @typedef {Object} UploadMeta
     * @property {boolean} isLoading - Indicates if the upload is currently loading.
     * @property {boolean} isProcessing - Indicates if the upload is currently processing.
     * @property {boolean} isComplete - Indicates if the upload has been completed.
     * @property {boolean} hasErrors - Indicates if there are any errors in the upload process.
     * @property {boolean} hasFile - Indicates if a file has been uploaded.
     *
     */
    meta,

    // --- context

    /**
     * The uploaded file object, if present.
     */
    file,

    /**
     * The name of the uploaded file.
     */
    name,

    /**
     * The creation date of the uploaded file, if available.
     */
    created,

    /**
     * The source URL of the uploaded file.
     */
    src,

    /**
     * Any errors encountered during upload.
     */
    errors,

    // --- methods

    /**
     * Add a new file to upload.
     * @param {string} value - The file path or URL to upload.
     * @return {Promise<string>} Resolves with the file path or URL after upload.
     * @throws {DetailedError} If the upload fails or times out.
     */
    add,

    /**
     * Load an image by type, typeId, and isDefault.
     * @param {any} type - The type of the image.
     * @param {any} typeId - The ID of the type.
     * @param {any} isDefault - Whether to load the default image.
     * @return {Promise<void>} Resolves when the image is loaded.
     * @throws {DetailedError} If the image cannot be found or loaded.
     */
    getImage,

    /**
     * Load an image by its hash.
     * @param {any} hash - The hash of the image to load.
     * @return {Promise<void>} Resolves when the image is loaded.
     * @throws {DetailedError} If the image cannot be found or loaded.
     */
    getImageByHash,

    /**
     * Remove the uploaded file.
     * @returns {void}
     */
    remove,

    /**
     * Stop the upload service.
     * @returns {void}
     */
    stop: () => stopService(service)
  };
};

/**
 * Return type for useUpload composable.
 */
export type useUpload = ReturnType<typeof useUpload>;
