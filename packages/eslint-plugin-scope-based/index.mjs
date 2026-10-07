/**
 * @fileoverview `scope-based` — the ESLint plugin enforcing the scope-based
 * composable variance law (ADR-001 / FE-2967). It replaces the hand-rolled
 * `law-checker.mjs`: five AST rules that run inside the repo's single flat
 * config, gaining editor squiggles, CI wiring, and the native
 * `// eslint-disable-*` waiver mechanism (disable / disable-line /
 * disable-next-line) for free.
 *
 *   no-self-branch          — clause 4: a module must not branch on the SELF sentinel
 *   require-decision        — clause 5: every @decision carries what/why/rejected
 *   no-cosplay-arm          — clauses 2+3: no byte-identical override, no empty scaffold
 *   complete-layer-set      — clause 1 (decidable): full sub-layer set + @internal markers
 *   actor-scope-first       — clause 1 (input signature): every sub-composable factory takes actorScope first
 *   arm-in-matrix           — an arm's actor must be declared in the scope matrix
 *   no-hand-rolled-int-fixture — *.int.test.ts response bodies must replay recorded
 *                                fixtures, never a hand-rolled local builder
 *   no-private-instance-axis   — instance keying is the scope registry's, not the
 *                                module's: no computed registration name, no local memo
 *   no-self-context            — a module never takes its own record as a `.for()`
 *                                context; its own record comes from `.withId(id)`
 *
 *   no-computed-effects     — a computed getter assigns nothing and calls nothing for effect
 *   no-local-state          — a module with no machine mints no ref / reactive
 *   no-services-in-read-layers — meta and context take no services parameter
 *   machine-service-event-data — a machine service destructures `{ data }`, not `event.data`
 *   services-factory-fns    — the services factory returns functions and key constants
 *   return-order            — return keys A-Z per section, sections ordered, spreads last
 *   no-inline-return-values — no inline computed or function in a return object
 *   export-return-type      — each composable and layer factory exports its ReturnType
 *   pagination-shape        — `pagination` is a computed { offset, limit, total }
 *   no-meta-object          — no single computed `meta` object
 *   meta-flag-name          — a meta member starts with is / has / can / show
 *   is-ready-contract       — lifecycle members live in actions; isReady is Promise<boolean>
 *   on-done-unsubscribes    — onDone registers its unsubscribe
 *   file-names              — {module}.{purpose}.{context?}.ts / use{Module}.{layer}.{actor?}.ts; no .base
 *   query-client-inside     — no QueryClient parameter on a factory
 *   destroy-removes-key     — destroy removes the registry key; the factory takes scopeKey
 *   state-paths-resolve     — a cited state / context path exists in the machine
 *   scope-naming            — scopeActor, scopeContext, <MODULE>_SCOPE_MATRIX
 *   scoped-factory          — a four-layer module passes its <MODULE>_SCOPE_MATRIX to createScopedComposable and returns the four layers
 *   no-local-query-type     — no local ReturnType alias of a query function
 *
 * @module packages/eslint-plugin-scope-based
 */

import noSelfBranch from "./rules/no-self-branch.mjs";
import requireDecision from "./rules/require-decision.mjs";
import noCosplayArm from "./rules/no-cosplay-arm.mjs";
import completeLayerSet from "./rules/complete-layer-set.mjs";
import actorScopeFirst from "./rules/actor-scope-first.mjs";
import armInMatrix from "./rules/arm-in-matrix.mjs";
import noHandRolledIntFixture from "./rules/no-hand-rolled-int-fixture.mjs";
import noPrivateInstanceAxis from "./rules/no-private-instance-axis.mjs";
import noSelfContext from "./rules/no-self-context.mjs";
import noComputedEffects from "./rules/no-computed-effects.mjs";
import noLocalState from "./rules/no-local-state.mjs";
import noServicesInReadLayers from "./rules/no-services-in-read-layers.mjs";
import machineServiceEventData from "./rules/machine-service-event-data.mjs";
import servicesFactoryFns from "./rules/services-factory-fns.mjs";
import returnOrder from "./rules/return-order.mjs";
import noInlineReturnValues from "./rules/no-inline-return-values.mjs";
import exportReturnType from "./rules/export-return-type.mjs";
import paginationShape from "./rules/pagination-shape.mjs";
import noMetaObject from "./rules/no-meta-object.mjs";
import metaFlagName from "./rules/meta-flag-name.mjs";
import isReadyContract from "./rules/is-ready-contract.mjs";
import onDoneUnsubscribes from "./rules/on-done-unsubscribes.mjs";
import fileNames from "./rules/file-names.mjs";
import queryClientInside from "./rules/query-client-inside.mjs";
import destroyRemovesKey from "./rules/destroy-removes-key.mjs";
import statePathsResolve from "./rules/state-paths-resolve.mjs";
import scopeNaming from "./rules/scope-naming.mjs";
import scopedFactory from "./rules/scoped-factory.mjs";
import noLocalQueryType from "./rules/no-local-query-type.mjs";

const plugin = {
  meta: { name: "scope-based", version: "1.0.0" },
  rules: {
    "no-self-branch": noSelfBranch,
    "require-decision": requireDecision,
    "no-cosplay-arm": noCosplayArm,
    "complete-layer-set": completeLayerSet,
    "actor-scope-first": actorScopeFirst,
    "arm-in-matrix": armInMatrix,
    "no-hand-rolled-int-fixture": noHandRolledIntFixture,
    "no-private-instance-axis": noPrivateInstanceAxis,
    "no-self-context": noSelfContext,
    "no-computed-effects": noComputedEffects,
    "no-local-state": noLocalState,
    "no-services-in-read-layers": noServicesInReadLayers,
    "machine-service-event-data": machineServiceEventData,
    "services-factory-fns": servicesFactoryFns,
    "return-order": returnOrder,
    "no-inline-return-values": noInlineReturnValues,
    "export-return-type": exportReturnType,
    "pagination-shape": paginationShape,
    "no-meta-object": noMetaObject,
    "meta-flag-name": metaFlagName,
    "is-ready-contract": isReadyContract,
    "on-done-unsubscribes": onDoneUnsubscribes,
    "file-names": fileNames,
    "query-client-inside": queryClientInside,
    "destroy-removes-key": destroyRemovesKey,
    "state-paths-resolve": statePathsResolve,
    "scope-naming": scopeNaming,
    "scoped-factory": scopedFactory,
    "no-local-query-type": noLocalQueryType
  }
};

export default plugin;
