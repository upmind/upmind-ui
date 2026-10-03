import { nextTick, watch } from "vue";
import { downloadBlob } from "../invoices/invoices.utils";
import { invalidateQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  NotAuthenticatedError,
  responseCodes
} from "../../utils";
import type {
  LegacyInvoiceItemQuery,
  LegacyInvoicesServices
} from "./legacy-invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoice.actions
 * @description Single-read actions — lifecycle and AC8's document download.
 * Query-backed: `destroy()` removes the registry entry, because there is no
 * service to stop. Ruling B7 — no `reset` handle on the manager (the
 * collection's-only member).
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useLegacyInvoice.actions.{actor}.ts` file exists.
 *
 * @decision
 * what: this file, `useLegacyInvoice.actions.ts`, exists although the query
 * template ships no matching template file for it.
 * why: `templates/SINGLE-READ.md` step 1 instructs copying the collection's
 * own `useLegacyInvoices.actions.ts` and renaming it for the single read's
 * singular name (`LegacyInvoice`) — "the single read's layers are the
 * collection's shape over an item query, not a different contract", so a
 * second near-identical template set is not shipped separately.
 * rejected: leaving this layer unwritten — clause 1 requires the uniform
 * four-layer return on both composables.
 */
export function createLegacyInvoiceActions(
  _actorScope: ScopeActorTypes,
  service: LegacyInvoicesServices,
  query: LegacyInvoiceItemQuery,
  isDownloading: Ref<boolean>,
  scopeKey: string
) {
  const { t } = useI18n();
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

  /** A first fetch that never settles must not leave `isReady()` waiting forever. */
  const READY_TIMEOUT_MS = 10_000;

  function addressableOutcome(): boolean | undefined {
    if (service.isAvailable.value) return true;
    if (isSessionInitialised.value || !isSessionSettling.value) return false;
    return undefined;
  }

  function whenSessionSettles(): Promise<boolean> {
    const settled = addressableOutcome();
    if (settled !== undefined) return Promise.resolve(settled);

    return new Promise<boolean>(resolve => {
      const stop = watch(
        [service.isAvailable, isSessionInitialised, isSessionSettling],
        () => {
          const outcome = addressableOutcome();
          if (outcome === undefined) return;
          stop();
          resolve(outcome);
        }
      );
    });
  }

  async function whenFetched(): Promise<boolean> {
    await nextTick();

    if (query.isFetched.value) return true;

    return new Promise<boolean>(resolve => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        stop();
        resolve(false);
      }, READY_TIMEOUT_MS);
      const stop = watch(query.isFetched, fetched => {
        if (!fetched || settled) return;
        settled = true;
        clearTimeout(timer);
        stop();
        resolve(true);
      });
    });
  }

  /**
   * Resolves once the record is ready to read.
   * @returns true once the first fetch has settled, false if the session
   * settles without an addressable client, or once the fetch times out.
   * Always SETTLES.
   */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;

    return whenFetched();
  }

  /**
   * Forces a re-read of the record from the server.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.withId(id)` mints a fresh read.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  /**
   * AC8 — downloads this record's PDF and saves it locally as
   * `${record.number}.pdf`, the record's own TOP-LEVEL number (design.md
   * 8.1). Ruling B5 — LI-1 owns this call; reuses only the generic
   * `downloadBlob` save helper from `invoices/invoices.utils`.
   * (`oracle: legacyInvoiceProvider.vue:201-227` — the `download` method:
   * dispatch `downloadLegacy`, then `${this.invoice.number}.pdf` +
   * `downloadBlob` at `:212-213`.)
   * @throws {DetailedError} when this scope's record has not loaded yet.
   * @throws {LegacyInvoiceDocumentNotReadyError} when the document is not
   * built yet (OD2, AC12).
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function downloadPdf(): Promise<void> {
    const record = query.data.value;
    if (!record?.id) {
      throw new DetailedError(
        t("error.invoice_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    }

    isDownloading.value = true;
    return service
      .downloadPdf(record.id)
      .then(blob => downloadBlob(blob, `${record.number}.pdf`))
      .finally(() => {
        isDownloading.value = false;
      });
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules
  // start armless). When a scope earns one, add
  // `useLegacyInvoice.actions.{actor}.ts` and spread it LAST so it wins.

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** AC8 — downloads and saves this record's PDF as `${number}.pdf`. */
    downloadPdf,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the record is ready to read. Always settles. */
    isReady,

    /** Refetches the record from the server; rejects if it cannot address one. */
    refresh

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseLegacyInvoiceActions = ReturnType<
  typeof createLegacyInvoiceActions
>;
