// -----------------------------------------------------------------------------
/**
 * @module plugins/chunk-recovery
 * @description Client-only plugin that clears the chunk retry flag
 * after each successful page navigation.
 */
import { clearChunkRetryFlag } from "~/funnels/utils";

// -----------------------------------------------------------------------------

export default defineNuxtPlugin(({ hook }) => {
  hook("page:finish", () => {
    clearChunkRetryFlag();
  });
});
