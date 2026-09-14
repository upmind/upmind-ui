import { nextTick, watch } from "vue";
import { invalidateQueryByKey, resetQueryByKey } from "../query";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { mapBrandDepartmentOptions } from "./tickets.mappers";
import { NotAuthenticatedError } from "../../utils";
import { omitBy, isNil } from "lodash-es";
import type {
  Ticket,
  TicketCreateModel,
  TicketDepartmentOption,
  TicketsListQuery,
  TicketsServices,
  TicketSupportPrefs
} from "./tickets.types";
import type { ScopeActorTypes } from "../scope/scope.types";
import type {
  ITicketDepartment,
  TicketStatusCodes
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useClientTickets.actions
 * @description Collection actions — list controls, create, and lifecycle.
 * @doctrine clause 2 (fresh modules start armless) — shared members only.
 */
export function createClientTicketsActions(
  _actorScope: ScopeActorTypes,
  service: TicketsServices,
  query: TicketsListQuery,
  scopeKey: string
) {
  const { isAvailable: isSessionInitialised, isLoading: isSessionSettling } =
    useActiveSession().useMeta();

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
      const stop = watch(query.isFetched, fetched => {
        if (!fetched) return;
        stop();
        resolve(true);
      });
    });
  }

  /** Resolves once the collection is ready to read. Always settles. */
  async function isReady(): Promise<boolean> {
    if (!(await whenSessionSettles())) return false;
    return whenFetched();
  }

  /** Forces a re-read of the list from the server. */
  async function refresh(): Promise<void> {
    if (!service.isAvailable.value) throw new NotAuthenticatedError();

    const { error } = await query.refetch();
    if (error instanceof NotAuthenticatedError) throw error;
  }

  /**
   * AC9 — builds the create body from the model. Field names are taken from
   * `research.md` D2 (read from legacy source, cross-checked, not this
   * document's own invention) — the exact wire shape still owes byte
   * confirmation against T2's recorded `post-tickets-case-create.json`
   * fixture; correct this mapping first if a captured field disagrees.
   */
  async function create(model: TicketCreateModel): Promise<Ticket> {
    const body = omitBy(
      {
        subject: model.subject,
        body: model.body,
        ticket_department_id: model.ticketDepartmentId ?? undefined,
        contract_product_id: model.contractProductId ?? undefined,
        client_id: service.clientId.value,
        brand_id: service.brandId.value,
        files: model.files,
        settings: model.scheduledAt
          ? { scheduled_datetime: model.scheduledAt }
          : undefined
      },
      isNil
    );

    const ticket = await service.createTicket(body);
    await invalidateQueryByKey(service.queryKey, { exact: false })(undefined);
    return ticket;
  }

  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  /**
   * AC31 — the create-form desk options (brand-public only), keyed on
   * `ticket_department_id` (Z7), with `isDefault` pre-selecting the brand's
   * default desk.
   */
  async function loadDepartmentOptions(): Promise<TicketDepartmentOption[]> {
    const rows = await service.loadBrandDepartments();
    return mapBrandDepartmentOptions(rows);
  }

  /** AC31 — the all-desks lookup (a different shape than the brand-public list, Z7). */
  async function loadAllDepartments(): Promise<ITicketDepartment[]> {
    return service.loadDepartments();
  }

  /** AC32 — the ticket-status vocabulary. */
  async function loadTicketStatuses(): Promise<
    { code: TicketStatusCodes; name: string }[]
  > {
    return service.loadTicketStatuses();
  }

  /** AC33 (R7) — read-modify-write over the client's meta map. */
  async function savePrefs(
    prefs: Partial<TicketSupportPrefs>
  ): Promise<TicketSupportPrefs> {
    return service.saveSupportPrefs(prefs);
  }

  /** AC3 — the page size persists via the same read-modify-write as AC33. */
  async function setPageSize(limit: number): Promise<void> {
    query.setCriteria({ pagination: { limit } } as never);
    await savePrefs({ limit });
  }

  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** AC9 — raises a new ticket; invalidates the list on success. */
    create,

    /** AC31 — all desks (the full-set shape; the create form uses `loadDepartmentOptions`). */
    loadAllDepartments,

    /** AC31 — the create-form desk options, keyed on `ticket_department_id`. */
    loadDepartmentOptions,

    /** AC32 — the ticket-status vocabulary. */
    loadTicketStatuses,

    /** Marks the shared cache key stale so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read. Always settles. */
    isReady,

    /** Fetches the next page of the list. */
    nextPage: query.fetchNextPage,

    /** Fetches the previous page of the list. */
    prevPage: query.fetchPreviousPage,

    /** Refetches the list from the server; rejects if it cannot address one. */
    refresh,

    /** Drops the shared cache key's rows so the next read starts from loading. */
    reset: resetQueryByKey(service.queryKey),

    /** AC33 (R7) — read-modify-write over the client's meta map. */
    savePrefs,

    /** Applies a criteria intent — merges `filters` / `sort` / `pagination`. */
    setCriteria: query.setCriteria,

    /** AC3 — persists the chosen page size via the same read-modify-write. */
    setPageSize
  };
}

// Type export for consumers
export type UseClientTicketsActions = ReturnType<
  typeof createClientTicketsActions
>;
