import { watch } from "vue";
import { interpret } from "xstate";
import { dataManagerMachine } from "../data-manager";
import { createScopedComposable } from "../scope/scope.builder";
import { useI18n } from "../system-localisation";
import createClientCompanyServices from "./client-company.services";
import { ClientCompanyContextTypes } from "./client-company.types";
import { createClientCompanyManagerActions } from "./useClientCompanyManager.actions";
import { createClientCompanyManagerContext } from "./useClientCompanyManager.context";
import { createClientCompanyManagerInternals } from "./useClientCompanyManager.internals";
import { createClientCompanyManagerMachineConfig } from "./useClientCompanyManager.machine";
import { createClientCompanyManagerMeta } from "./useClientCompanyManager.meta";
import {
  createActor,
  contextMatches,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { ClientCompanyScopeMatrix } from "./client-company.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanyManager
 * @description Scoped per-company form editor, backed by the shared
 * `dataManagerMachine`. One interpreter per concrete `(actor, company)`
 * scope: the company being edited comes from `.for('company', id)`, and a
 * new one is minted with `.fresh()`. Registered under the same module name as
 * `useClientCompanies`; the scope key carries the differentiation.
 *
 * The `clientId` constructor option the pre-conversion `useClientCompanyManager`
 * advertised (`useClientCompanyManager(id, { clientId })`) is REMOVED outright
 * (operator ruling R2, `design.md` D4) — `createScopedComposable` hands the
 * per-scope factory no consumer-parameter channel, so the option could not
 * survive the conversion in any shape, and it never reached a request URL to
 * begin with. The target client resolves EXCLUSIVELY through
 * `resolveClientId(scopeContext)`, seeded into machine context below.
 *
 * @doctrine clause 1 (uniform four-layer default) — identical return shape to
 * the collection half.
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; never branch on SELF in this file.
 */
function createClientCompanyManagerForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const { t } = useI18n();

  const actorScope = config.actor as ScopeActorTypes;

  /**
   * The company being edited is carried by the scope context; absent
   * (`.fresh()`) → a new company. Reading the id from the scope rather than
   * an argument is what makes two concurrently-open editors two distinct
   * registry entries instead of one shared machine.
   */
  const companyId =
    config.context?.type === ClientCompanyContextTypes.COMPANY
      ? config.context.id
      : undefined;

  /**
   * ONE services instance for this scope, threaded into the machine config.
   * `config.context` goes in here and nowhere else — every request the
   * manager issues, directly or through the machine, inherits the same
   * resolved client.
   */
  const service = createClientCompanyServices(actorScope, config.context);

  const machineService = interpret(
    dataManagerMachine
      .withConfig(
        createClientCompanyManagerMachineConfig(service, config.context)
      )
      .withContext({
        id: companyId,
        // Identity, seeded from the ONE seam (D4). Never read `activeUser`
        // directly in this file.
        clientId: service.clientId.value,
        // Scoped instances are persistent editors — stay editable after a
        // save (the machine returns to `available` instead of the `complete`
        // final state) so a remounting form re-uses the same instance.
        allowMultipleEdits: true
      }),
    {
      // The scope key, not the company id: `.fresh()` mints a unique key per
      // call, so two concurrent drafts get two distinct interpreters instead
      // of colliding on a shared "new-company" id (AC-15).
      id: scopeKey,
      devTools: false
    }
  );
  machineService.start();

  const actorRef = createActor(machineService);
  if (!actorRef) {
    throw new DetailedError(
      t("error.client_company_not_available"),
      responseCodes.Service_Unavailable,
      ErrorOrigin.Headless,
      { scope: config }
    );
  }

  /**
   * Late top-up ONLY. The machine's `hasSubscription` guard holds it in
   * `subscribing` until a client id exists, and at construction the session
   * may not have resolved yet. The id is watched off `service.clientId` — the
   * ONE identity seam, never a second session read — and `refreshContext`
   * keeps an already-present value, so this can never clobber a resolved
   * retarget.
   */
  const stopClientIdTopUp = watch(service.clientId, resolvedClientId => {
    if (!resolvedClientId || contextMatches(actorRef.state, "clientId")) return;
    stopClientIdTopUp();
    actorRef.send({ type: "REFRESH", data: { clientId: resolvedClientId } });
  });

  /**
   * ONE actions instance per scope, not one per `useActions()` call: `input`
   * is debounced, so a debouncer minted per call gives two keystrokes two
   * independent timers. The stateless layers below stay lazy.
   */
  const actions = createClientCompanyManagerActions(
    actorScope,
    actorRef,
    service,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for manager actions (form input, save, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for manager context (model, schema, errors). */
    useContext: () => createClientCompanyManagerContext(actorScope, actorRef),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () =>
      createClientCompanyManagerInternals(actorScope, actorRef),

    /** Sub-composable for manager meta (state flags). */
    useMeta: () => createClientCompanyManagerMeta(actorScope, actorRef)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for editing ONE client company.
 *
 * @example
 * ```ts
 * // Edit an existing company
 * const manager = useClientCompanyManager().as('client').for('company', companyId)
 * const { model, schema, uischema } = manager.useContext()
 * await manager.useActions().isReady()
 * await manager.useActions().update({ name: 'New Name' })
 *
 * // Create a new company (isolated instance, distinct scope key)
 * const draft = useClientCompanyManager().as('client').fresh()
 * ```
 */
export const useClientCompanyManager = createScopedComposable<
  ReturnType<typeof createClientCompanyManagerForScope>,
  ClientCompanyScopeMatrix
>("client-company", createClientCompanyManagerForScope);

// Type export for consumers
export type UseClientCompanyManager = ReturnType<
  typeof useClientCompanyManager
>;

/**
 * Deprecated alias — the pre-conversion barrel exported this composable's
 * return type as `UseClientCompany` (a name mismatched with the composable
 * it describes). Kept because it is on the published package surface and
 * dropping it is a breaking change with no capability behind it
 * (`parity.yaml` C35, `design.md` D7).
 * @deprecated use {@link UseClientCompanyManager}
 */
export type UseClientCompany = UseClientCompanyManager;
