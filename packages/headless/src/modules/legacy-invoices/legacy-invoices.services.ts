/** @internal */
import { computed } from "vue";
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { mapLegacyInvoice, mapLegacyInvoices } from "./legacy-invoices.mappers";
import { useQuerySchema } from "./legacy-invoices.schemas";
import { LegacyInvoiceDocumentNotReadyError } from "./legacy-invoices.types";
import {
  useTime,
  NotAuthenticatedError,
  DEBOUNCE_DELAY,
  responseCodes
} from "../../utils";
import type {
  LegacyInvoice,
  LegacyInvoiceAvailabilityQuery,
  LegacyInvoiceItemQuery,
  LegacyInvoiceQueryModel,
  LegacyInvoicesListQuery,
  LegacyInvoicesServices
} from "./legacy-invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IClient, ILegacyInvoice } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/legacy-invoices.services
 * @description The ONE services file both halves consume — the collection's
 * `loadList` and the single read's `loadOne`, plus the document read this
 * module owns outright (ruling B5). Client path only, never
 * `api/admin/…` (FE-3230 Out of Scope, standing constraint). One factory on
 * purpose: one identity seam, one cache key, one arm-resolution switch, so
 * the two composables can never disagree about whose archive is being read.
 * Model: `invoices/invoices.services.ts`.
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useLegacyInvoices.ts` / `useLegacyInvoice.ts` only
 * (`@internal/no-cross-module-imports`).
 */
// -----------------------------------------------------------------------------

/** The module's base cache key. */
export const queryKey: QueryKey = ["legacy-invoices"];

/** The single-read include set (design.md 8.1) — reaches the import relation, though no member is minted for it (D-17). (`oracle: legacyInvoiceProvider.vue:193-196`) */
const LOAD_ONE_PARAMS = {
  with_staged_imports: 1,
  with: "import.credentials,import.source"
};

/** The availability read's include — requests the `legacy_invoices` relation so the API computes `has_legacy_invoices` (`oracle: clients/index.ts:158`). The relation payload itself is unused. */
const AVAILABILITY_PARAMS = { with: "legacy_invoices" };

/**
 * The ONE addressability predicate every request gate in this file calls.
 * `client × self` is the whole cell set (ruling OD1, standing constraint): no
 * `.for()` context ever resolves, so this reads the signed-in client only.
 */
function isAddressable(): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();

  return isAuthenticated.value && !!activeUser.value?.id;
}

/** The list. Client path only — no `filter[client_id]`, no `with_staged_imports` (ruling B2, AC1). Path `api/import_invoice_data` (`oracle: legacyInvoices/index.ts:14` client path, `:24-34` list action). */
function loadList(): LegacyInvoicesListQuery {
  const { list, useUrl } = useQuery();
  const { activeUser } = useActiveSession().useContext();
  const clientId = computed(() => activeUser.value?.id);

  return list<ILegacyInvoice[], LegacyInvoice[], LegacyInvoiceQueryModel>({
    criteria: { schema: useQuerySchema() },
    queryKey: [...queryKey, { client: clientId.value }],
    url: useUrl("import_invoice_data"),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable()) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => isAddressable(),
    select: mapLegacyInvoices,
    staleTime: useTime().DAY,
    retryDelay: DEBOUNCE_DELAY
  });
}

/**
 * SINGLE READ — the reactive item query, minted once per scope. An absent id
 * issues NO request. Path `import_invoice_data/{id}` (`oracle:
 * legacyInvoices/index.ts:40` get path, `:35-45` get action).
 */
function loadOne(recordId?: LegacyInvoice["id"]): LegacyInvoiceItemQuery {
  const { query, useUrl } = useQuery();
  const { activeUser } = useActiveSession().useContext();
  const clientId = computed(() => activeUser.value?.id);

  return query<ILegacyInvoice, LegacyInvoice>({
    queryKey: [...queryKey, "record", recordId, { client: clientId.value }],
    url: useUrl(`import_invoice_data/${recordId}`, LOAD_ONE_PARAMS),
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!recordId || !isAddressable()) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => !!recordId && isAddressable(),
    select: mapLegacyInvoice,
    staleTime: useTime().DAY
  });
}

/**
 * AC5 — the module's OWN availability read, minted reactively like the list.
 * Reads the signed-in client with the `legacy_invoices` relation requested, so
 * the API computes `has_legacy_invoices`; the `/self` include the session store
 * issues does not request it, so `activeUser.hasLegacyInvoices` reports a false
 * negative for a client who owns imported invoices (`oracle:
 * clients/index.ts:158`, `src/views/client/billing/legacy-invoices/index.vue:55`).
 * Selected to the flag; the relation payload is discarded.
 */
function loadAvailability(): LegacyInvoiceAvailabilityQuery {
  const { query, useUrl } = useQuery();
  const { activeUser } = useActiveSession().useContext();
  const clientId = computed(() => activeUser.value?.id);

  return query<IClient, boolean>({
    queryKey: [...queryKey, "availability", { client: clientId.value }],
    url: useUrl(`clients/${clientId.value}`, AVAILABILITY_PARAMS),
    withAccessToken: true,
    withoutLocale: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (!isAddressable()) {
          reject(new NotAuthenticatedError());
          return;
        }
        resolve(true);
      }),
    enabled: () => isAddressable(),
    select: client => !!client?.has_legacy_invoices,
    staleTime: useTime().DAY
  });
}

/**
 * AC8 — LI-1's own document read (ruling B5): the `invoices` exemplar's
 * `downloadPdf` hard-codes `invoices/{id}/download` and cannot serve
 * `import_invoice_data/{id}/download_pdf`. A 404 raises OD2's typed
 * condition; any other failure raises the ordinary failure (AC12).
 * (`oracle: pdfs.ts:42-57` downloadLegacy, path `:49-51`.)
 */
async function downloadPdf(recordId: LegacyInvoice["id"]): Promise<Blob> {
  const { download, useUrl } = useQuery();

  if (!isAddressable()) throw new NotAuthenticatedError();

  return download({
    url: useUrl(`import_invoice_data/${recordId}/download_pdf`),
    withAccessToken: true
  }).catch(error => {
    // oracle: pdfs.ts:70-73 — a 404 means the file is still generating.
    if (error?.code === responseCodes.Not_Found)
      throw new LegacyInvoiceDocumentNotReadyError();
    throw error;
  });
}

// -----------------------------------------------------------------------------
// Scope-Ready Services

/**
 * Arm-resolution switch: only its `default:` case exists (arms: none). Every
 * cell but `client × self` is `null as never` (ruling OD1), so there is no
 * second actor for any member to diverge from. The type system does not
 * refuse the staff actor outright [w9] — this switch, plus the all-`never`
 * matrix, are the two things that hold the cell boundary (design.md 8.7).
 */
function scopedServices(
  _scopeActor: ScopeActorTypes
): Partial<LegacyInvoicesServices> {
  switch (_scopeActor) {
    default:
      return {};
  }
}

/** One services instance per scope. */
export const createLegacyInvoicesServices = (
  scopeActor: ScopeActorTypes
): LegacyInvoicesServices => {
  return {
    queryKey,
    isAvailable: computed(() => isAddressable()),
    error: computed<ResponseError | undefined>(() => undefined),
    loadList,
    loadAvailability,
    loadOne,
    downloadPdf,
    ...scopedServices(scopeActor)
  };
};

export default createLegacyInvoicesServices;
