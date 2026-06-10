// --- external
import { computed } from "vue";

// --- internal
import { useSession } from "./useSession";
import { useGuestEmailUischemaParser } from "./client/utils";

// -----------------------------------------------------------------------------
/**
 * @module session/useGuestEmail
 * @description Composable for the guest "Email for order receipt" autosave
 * field. Wraps {@link useSession} and exposes the bits the UI needs, with the
 * uischema re-derived from the parser so runtime per-control options
 * (`loading`, `success`) flow to the renderer via `appliedOptions`. Same
 * inline-computed pattern as `usePaymentDetail.uischemaAmount`.
 */
export const useGuestEmail = () => {
  const session = useSession();
  const { meta, model, schema, validationErrors, client } = session;

  /**
   * True when the form's value is in sync with the persisted email on the
   * client (the BE stores a guest client's email in `client.username`).
   * Drives the input's check-icon "saved" indicator.
   */
  const isSaved = computed(() => {
    const current = model.value?.email;
    const persisted = client.value?.email ?? client.value?.username;
    return !!current && current === persisted;
  });

  /**
   * UI Schema re-derived from the parser with the current runtime options
   * baked into the email control. The renderer reads these via
   * `appliedOptions` — no form-level plumbing required.
   */
  const uischema = computed(() =>
    useGuestEmailUischemaParser({
      loading: meta.value.isProcessing,
      success: isSaved.value
    })
  );

  // ---------------------------------------------------------------------------
  return {
    meta,
    model,
    schema,
    uischema,
    validationErrors,
    setModel: session.setModel,
    showGuestEmail: session.showGuestEmail,
    updateGuestEmail: session.updateGuestEmail
  };
};

/** The return type of {@link useGuestEmail} composable. */
export type UseGuestEmail = ReturnType<typeof useGuestEmail>;
