// -----------------------------------------------------------------------------
/**
 * @module plugins/chunk-recovery
 * @description Client-only plugin that clears the chunk retry flag
 * after each successful page navigation.
 */
import { useAssetRecovery } from "../shell/modules/system/useAssetRecovery";

// -----------------------------------------------------------------------------

export default defineNuxtPlugin(({ hook }) => {
  const { clear } = useAssetRecovery();

  hook("page:finish", () => {
    clear();
  });
});
