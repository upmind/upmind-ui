/**
 * @fileoverview RuleTester specs for the `scope-based` plugin.
 *
 * Every rule has BOTH directions covered (a valid case and an invalid case for
 * each discriminator), and the discriminators themselves are load-bearing:
 * these specs were rebuilt after a mutation pass showed the originals stayed
 * green when the rules' core logic was gutted (normalizeBody → identity,
 * createScopedComposable detection → false, EQUALITY_OPERATORS → just `===`,
 * etc.). Each such mutation now turns a spec red.
 *
 * Cross-file rules (no-cosplay-arm, complete-layer-set, arm-in-matrix) run
 * against real fixture files in a fresh temp dir, so the disk reads are real.
 *
 * Run: node --test packages/eslint-plugin-scope-based/scope-based.test.mjs
 */

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noSelfBranch from "./rules/no-self-branch.mjs";
import requireDecision from "./rules/require-decision.mjs";
import noCosplayArm from "./rules/no-cosplay-arm.mjs";
import completeLayerSet from "./rules/complete-layer-set.mjs";
import actorScopeFirst from "./rules/actor-scope-first.mjs";
import armInMatrix from "./rules/arm-in-matrix.mjs";
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

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const root = mkdtempSync(join(tmpdir(), "scope-based-fixtures-"));
function fixture(relPath, content) {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
  return abs;
}
const read = f => ({ code: readFileSync(f, "utf8"), filename: f });
process.on("exit", () => rmSync(root, { recursive: true, force: true }));

// ---------------------------------------------------------------------------
test("no-self-branch", () => {
  ruleTester.run("no-self-branch", noSelfBranch, {
    valid: [
      { code: `const s = useX().as(ScopeActorTypes.SELF);` },
      { code: `const s = useX().as("self");` },
      { code: `const M = { [ScopeActorTypes.SELF]: 1 } as const;` },
      { code: `fetch("/self/profile");` },
      { code: `const x = ScopeActorTypes.SELF;` }, // value position, not a branch
      {
        code: `switch (a) { case ScopeActorTypes.SELF: break; }`,
        filename: "/repo/packages/headless/src/modules/scope/scope.utils.ts"
      }
    ],
    invalid: [
      {
        code: `switch (a) { case ScopeActorTypes.SELF: break; }`,
        errors: [{ messageId: "selfBranch" }]
      },
      {
        code: `switch (a) { case "self": break; }`,
        errors: [{ messageId: "selfBranch" }]
      },
      // Operator coverage: === / !== / == / != (mutation: shrinking the set to `===` must go red)
      {
        code: `if (a === ScopeActorTypes.SELF) { go(); }`,
        errors: [{ messageId: "selfBranch" }]
      },
      {
        code: `if (a !== ScopeActorTypes.SELF) { go(); }`,
        errors: [{ messageId: "selfBranch" }]
      },
      {
        code: `if (a == "self") { go(); }`,
        errors: [{ messageId: "selfBranch" }]
      },
      {
        code: `if (a != "self") { go(); }`,
        errors: [{ messageId: "selfBranch" }]
      },
      // B3: a one-token TS cast / non-null must NOT hide the branch
      {
        code: `switch (a) { case (ScopeActorTypes.SELF as ScopeActorTypes): break; }`,
        errors: [{ messageId: "selfBranch" }]
      },
      {
        code: `if (a === ScopeActorTypes.SELF!) { go(); }`,
        errors: [{ messageId: "selfBranch" }]
      },
      {
        code: `if (a === ("self" as unknown)) { go(); }`,
        errors: [{ messageId: "selfBranch" }]
      },
      // W76: array-membership branch on SELF
      {
        code: `if ([ScopeActorTypes.SELF, ScopeActorTypes.GUEST].includes(a)) { go(); }`,
        errors: [{ messageId: "selfBranch" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("require-decision", () => {
  ruleTester.run("require-decision", requireDecision, {
    valid: [
      {
        code: `/**\n * @decision\n * what: use X\n * why: faster\n * rejected: Y\n */\nconst a = 1;`
      },
      { code: `// a normal comment\nconst a = 1;` },
      // two complete back-to-back blocks
      {
        code: `// @decision\n// what: a\n// why: b\n// rejected: c\n// @decision\n// what: d\n// why: e\n// rejected: f\nconst a = 1;`
      },
      // W112: a prose cross-reference is not a block
      {
        code: `// See the @decision recorded in ADR-001 for the rationale.\nconst a = 1;`
      },
      { code: `/** See the @decision in ADR-001. */\nconst a = 1;` },
      // W128: a blank line inside a complete line-comment block is tolerated
      {
        code: `// @decision\n// what: a\n// why: b\n\n// rejected: c\nconst a = 1;`
      }
    ],
    invalid: [
      {
        code: `/**\n * @decision\n * what: use X\n * why: faster\n */\nconst a = 1;`,
        errors: [{ messageId: "missingFields" }]
      },
      // Second back-to-back block incomplete — must NOT inherit the first's fields
      {
        code: `// @decision\n// what: a\n// why: b\n// rejected: c\n// @decision\n// what: d\nconst a = 1;`,
        errors: [{ messageId: "missingFields" }]
      },
      // Missing `what:` specifically (mutation: dropping `what` from the required set must go red)
      {
        code: `/**\n * @decision\n * why: b\n * rejected: c\n */\nconst a = 1;`,
        errors: [{ messageId: "missingFields" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("no-cosplay-arm", () => {
  // B1 — shorthand members resolve to the referenced function BODY, not the name.
  // GOOD: genuine override (different body) + exclusive, both returned shorthand.
  fixture(
    "b1/thing.services.ts",
    `function authenticate() { return "shared-auth"; }\nfunction loadList() { return "shared-list"; }\nexport const createThingServices = () => ({ authenticate, loadList });\n`
  );
  const b1Good = fixture(
    "b1/thing.services.client.ts",
    `function authenticate() { return "client-auth"; }\nfunction registerAsGuest() { return "guest-reg"; }\nexport const createThingServicesClient = () => ({ authenticate, registerAsGuest });\n`
  );
  // B1 COSPLAY: shorthand override whose referenced body is byte-identical to shared.
  fixture(
    "b1c/thing.services.ts",
    `function authenticate() { return "shared-auth"; }\nexport const createThingServices = () => ({ authenticate });\n`
  );
  const b1Cosplay = fixture(
    "b1c/thing.services.client.ts",
    `function authenticate() { return "shared-auth"; }\nexport const createThingServicesClient = () => ({ authenticate });\n`
  );

  // normalizeBody load-bearing: arm differs from shared ONLY by whitespace/comment.
  fixture(
    "nb/thing.services.ts",
    `export const createThingServices = () => ({ loadList: () => { return 1; } });\n`
  );
  const nbCosplay = fixture(
    "nb/thing.services.client.ts",
    `export const createThingServicesClient = () => ({ loadList: () => { return 1; /* c */ } });\n`
  );

  // EMPTY / JUSTIFIED / DELEGATE
  fixture(
    "empty/thing.services.ts",
    `export const createThingServices = () => ({ loadList: () => 1 });\n`
  );
  const emptyArm = fixture(
    "empty/thing.services.client.ts",
    `export const createThingServicesClient = () => ({});\n`
  );
  fixture(
    "just/thing.services.ts",
    `export const createThingServices = () => ({ loadList: () => "x" });\n`
  );
  const justArm = fixture(
    "just/thing.services.client.ts",
    `export const createThingServicesClient = () => ({\n  /**\n   * @decision\n   * what: loadList override for client\n   * why: client paginates differently\n   * rejected: sharing the shared impl\n   */\n  loadList: () => "x"\n});\n`
  );
  fixture(
    "del/thing.services.ts",
    `export const createThingServices = () => ({ authenticate: (c, e) => scopedServices(c.scopeActor).authenticate(c, e) });\n`
  );
  const delArm = fixture(
    "del/thing.services.client.ts",
    `export const createThingServicesClient = () => ({ authenticate: (c, e) => scopedServices(c.scopeActor).authenticate(c, e) });\n`
  );

  // W137 — renamed body-identical member in a NON-schemas (actions) layer.
  fixture(
    "w137/thing.actions.ts",
    `export const createThingActions = () => ({ destroy: () => { cleanup(); return true; } });\n`
  );
  const w137Arm = fixture(
    "w137/thing.actions.client.ts",
    `export const createThingActionsClient = () => ({ teardown: () => { cleanup(); return true; }, extra: () => 9 });\n`
  );

  // W103 — unrelated exported config constants must NOT collide into the surface.
  fixture(
    "w103/thing.services.ts",
    `export const SHARED_DEFAULTS = { timeout: 5000 };\nexport const createThingServices = () => ({ loadList: () => 1 });\n`
  );
  const w103Arm = fixture(
    "w103/thing.services.client.ts",
    `export const CLIENT_META = { timeout: 5000 };\nexport const createThingServicesClient = () => ({ onlyClient: () => 2 });\n`
  );

  // B2 — re-export barrel shared (real auth.schemas.ts shape) must not be "unparseable".
  fixture(
    "b2/thing.schemas.ts",
    `export { useThingModelParser } from "./thing.schemas.model";\nexport { useThingSchemaParser } from "./thing.schemas.form";\n`
  );
  const b2Barrel = fixture(
    "b2/thing.schemas.client.ts",
    `export const useClientThingExtraParser = (m) => ({ ...m, clientOnly: 1 });\n`
  );
  // B2 — default-export factory arm must be harvested (not emptyArm).
  fixture(
    "b2d/thing.services.ts",
    `export const createThingServices = () => ({ loadList: () => 2 });\n`
  );
  const b2Default = fixture(
    "b2d/thing.services.client.ts",
    `function onlyClient() { return 1; }\nexport default function createThingServicesClient() { return { onlyClient }; }\n`
  );

  // schemas VALID — a genuinely divergent parser arm passes.
  fixture(
    "sv/thing.schemas.ts",
    `export const useThingModelParser = (m) => ({ ...m });\n`
  );
  const svArm = fixture(
    "sv/thing.schemas.client.ts",
    `export const useClientThingModelParser = (m) => ({ ...m, clientField: true });\n`
  );
  // schemas COSPLAY — differently-named but body-identical.
  fixture(
    "sc/thing.schemas.ts",
    `export const useThingModelParser = (m) => ({ ...m });\n`
  );
  const scArm = fixture(
    "sc/thing.schemas.client.ts",
    `export const useClientThingModelParser = (m) => ({ ...m });\n`
  );

  // Defensive-error coverage: noShared + sharedUnparseable.
  const noSharedArm = fixture(
    "ns/thing.services.client.ts",
    `export const createThingServicesClient = () => ({ x: () => 1 });\n`
  ); // no sibling
  fixture("un/thing.services.ts", `export const NOT_A_FACTORY = 1;\n`);
  const unparseableArm = fixture(
    "un/thing.services.client.ts",
    `export const createThingServicesClient = () => ({ x: () => 1 });\n`
  );

  ruleTester.run("no-cosplay-arm", noCosplayArm, {
    valid: [
      read(b1Good),
      read(justArm),
      read(delArm),
      read(w103Arm),
      read(b2Barrel),
      read(b2Default),
      read(svArm),
      {
        code: `export const x = 1;`,
        filename: join(root, "b1/thing.services.ts")
      } // not an arm — inert
    ],
    invalid: [
      { ...read(b1Cosplay), errors: [{ messageId: "cosplayMember" }] },
      { ...read(nbCosplay), errors: [{ messageId: "cosplayMember" }] },
      { ...read(emptyArm), errors: [{ messageId: "emptyArm" }] },
      { ...read(w137Arm), errors: [{ messageId: "cosplayMember" }] },
      { ...read(scArm), errors: [{ messageId: "cosplaySchema" }] },
      { ...read(noSharedArm), errors: [{ messageId: "noShared" }] },
      { ...read(unparseableArm), errors: [{ messageId: "sharedUnparseable" }] }
    ]
  });
});

// ---------------------------------------------------------------------------
test("complete-layer-set", () => {
  // GOOD: full sub-layer set.
  const goodEntry = fixture(
    "lg/useThing.ts",
    `export const useThing = () => 1;\n`
  );
  fixture("lg/useThing.actions.ts", `export const x = 1;\n`);
  fixture("lg/useThing.context.ts", `export const x = 1;\n`);
  fixture("lg/useThing.meta.ts", `export const x = 1;\n`);
  fixture("lg/useThing.internals.ts", `export const x = 1;\n`);

  // BAD: partial split — actions+context present, meta+internals missing.
  const badEntry = fixture(
    "lb/useThing.ts",
    `export const useThing = () => 1;\n`
  );
  fixture("lb/useThing.actions.ts", `export const x = 1;\n`);
  fixture("lb/useThing.context.ts", `export const x = 1;\n`);

  // W66: factory-only scaffold (no sibling layers) — AST detection must fire.
  const scaffold = fixture(
    "scaf/useScaffold.ts",
    `import { createScopedComposable } from "@upmind-automation/headless";\nexport const useScaffold = () => createScopedComposable();\n`
  );
  // W66: a flat composable that only MENTIONS the factory in a comment is not scoped.
  const flatComment = fixture(
    "flatc/useFlat.ts",
    `// A flat utility — unlike createScopedComposable, no actor scope.\nexport const useFlat = () => 1;\n`
  );
  // Plain flat composable (no factory, no layers).
  const flatEntry = fixture(
    "flat/useDomain.ts",
    `export const useDomain = () => 1;\n`
  );

  // @internal markers.
  const internalGood = fixture(
    "ig/thing.services.ts",
    `/** @internal */\nexport const createThingServices = () => ({});\n`
  );
  const internalBad = fixture(
    "ib/thing.services.ts",
    `export const createThingServices = () => ({});\n`
  );
  // W89: @internal past line 15 must still count (full-text scan, not a 15-line window).
  const internalLate = fixture(
    "il/thing.services.ts",
    Array.from({ length: 16 }, (_, i) => `import { x${i} } from "m${i}";`).join(
      "\n"
    ) + `\n/** @internal */\nexport const createThingServices = () => ({});\n`
  );
  // An actor arm is NOT a data-layer base file — must not be flagged missingInternal.
  const internalArm = fixture(
    "ia/thing.services.client.ts",
    `export const createThingServicesClient = () => ({ x: () => 1 });\n`
  );

  ruleTester.run("complete-layer-set", completeLayerSet, {
    valid: [
      read(goodEntry),
      read(flatComment),
      read(flatEntry),
      read(internalGood),
      read(internalLate),
      read(internalArm)
    ],
    invalid: [
      {
        ...read(badEntry),
        errors: [{ messageId: "missingLayer" }, { messageId: "missingLayer" }]
      },
      {
        ...read(scaffold),
        errors: [
          { messageId: "missingLayer" },
          { messageId: "missingLayer" },
          { messageId: "missingLayer" },
          { messageId: "missingLayer" }
        ]
      },
      { ...read(internalBad), errors: [{ messageId: "missingInternal" }] }
    ]
  });
});

// ---------------------------------------------------------------------------
test("actor-scope-first", () => {
  // A scope-based entry (uses createScopedComposable) — its layer factories
  // must take actorScope first.
  const scopedEntry = code =>
    `import { createScopedComposable } from "@upmind-automation/headless";\n${code}`;

  // GOOD: actorScope first (consumed).
  fixture("asf-good/useThing.ts", scopedEntry(`export const useThing = 1;\n`));
  const goodFirst = fixture(
    "asf-good/useThing.context.ts",
    `export function createThingContext(actorScope: ScopeActorTypes, query: Q) {\n  return { actorScope };\n}\n`
  );
  // GOOD: unused scope is `_actorScope` first (the manager convention).
  fixture(
    "asf-unused/useThing.ts",
    scopedEntry(`export const useThing = 1;\n`)
  );
  const goodUnused = fixture(
    "asf-unused/useThing.meta.ts",
    `export function createThingMeta(_actorScope: ScopeActorTypes, query: Q) {\n  return { query };\n}\n`
  );
  // GOOD: arrow-const factory, actorScope first.
  fixture("asf-arrow/useThing.ts", scopedEntry(`export const useThing = 1;\n`));
  const goodArrow = fixture(
    "asf-arrow/useThing.actions.ts",
    `export const createThingActions = (actorScope: ScopeActorTypes, svc: S) => ({ actorScope });\n`
  );
  // GOOD (gate): a singleton store — entry does NOT use createScopedComposable —
  // is not held to the actor-scoped signature (session-store analog).
  fixture("asf-singleton/useSession.ts", `export const useSession = 1;\n`);
  const singleton = fixture(
    "asf-singleton/useSession.context.ts",
    `export function createSessionContext(_sessionId?: string) {\n  return {};\n}\n`
  );
  // GOOD (arm): an actor arm takes the resolved actor context, never actorScope.
  fixture("asf-arm/useThing.ts", scopedEntry(`export const useThing = 1;\n`));
  const arm = fixture(
    "asf-arm/useThing.context.client.ts",
    `export function createThingClientContext(query: Q) {\n  return {};\n}\n`
  );

  // BAD: actorScope dropped entirely (the FE-2968 incident shape).
  fixture("asf-drop/useThing.ts", scopedEntry(`export const useThing = 1;\n`));
  const dropped = fixture(
    "asf-drop/useThing.context.ts",
    `export function createThingContext(query: Q) {\n  return { query };\n}\n`
  );
  // BAD: actorScope present but SECOND — position is load-bearing.
  fixture("asf-pos/useThing.ts", scopedEntry(`export const useThing = 1;\n`));
  const misPositioned = fixture(
    "asf-pos/useThing.internals.ts",
    `export function createThingInternals(query: Q, actorScope: ScopeActorTypes) {\n  return { query, actorScope };\n}\n`
  );
  // BAD: no parameters at all.
  fixture("asf-none/useThing.ts", scopedEntry(`export const useThing = 1;\n`));
  const noParams = fixture(
    "asf-none/useThing.meta.ts",
    `export function createThingMeta() {\n  return {};\n}\n`
  );

  ruleTester.run("actor-scope-first", actorScopeFirst, {
    valid: [
      read(goodFirst),
      read(goodUnused),
      read(goodArrow),
      read(singleton),
      read(arm)
    ],
    invalid: [
      { ...read(dropped), errors: [{ messageId: "actorScopeFirst" }] },
      { ...read(misPositioned), errors: [{ messageId: "actorScopeFirst" }] },
      { ...read(noParams), errors: [{ messageId: "actorScopeFirst" }] }
    ]
  });
});

// ---------------------------------------------------------------------------
test("arm-in-matrix", () => {
  fixture(
    "mtx/thing.matrix.ts",
    `export const THING_SCOPE_MATRIX = {\n  [ScopeActorTypes.CLIENT]: {},\n  [ScopeActorTypes.STAFF]: {}\n} as const;\n`
  );
  fixture(
    "mtx/thing.services.ts",
    `export const createThingServices = () => ({});\n`
  );
  const clientArm = fixture(
    "mtx/thing.services.client.ts",
    `export const createThingServicesClient = () => ({ x: () => 1 });\n`
  );
  const guestOrphan = fixture(
    "mtx/thing.services.guest.ts",
    `export const createThingServicesGuest = () => ({ x: () => 1 });\n`
  );

  fixture(
    "nomtx/thing.services.ts",
    `export const createThingServices = () => ({});\n`
  );
  const noMatrixArm = fixture(
    "nomtx/thing.services.client.ts",
    `export const createThingServicesClient = () => ({ x: () => 1 });\n`
  );

  ruleTester.run("arm-in-matrix", armInMatrix, {
    valid: [read(clientArm), read(noMatrixArm)],
    invalid: [{ ...read(guestOrphan), errors: [{ messageId: "orphanArm" }] }]
  });
});

// ---------------------------------------------------------------------------
// Instance keying is the scope registry's seam, not a module's (FE-3034,
// 2026-09-15). Each discriminator below is load-bearing: dropping the
// string-literal check, the REGISTRAR name match, the module-scope test, or the
// `registrarCalls.length` guard turns one of these red.
test("no-private-instance-axis", () => {
  ruleTester.run("no-private-instance-axis", noPrivateInstanceAxis, {
    valid: [
      // The one valid shape — a bare string-literal registration name.
      {
        code: `const c = createScopedComposable("client-custom-fields", f, M);`
      },
      // A namespaced import of the registrar, still a literal name.
      { code: `const c = scope.createScopedComposable("thing", f, M);` },
      // A module-scope Map in a file that never registers is not a memo.
      { code: `const cache = new Map(); export function useThing() {}` },
      // A Map INSIDE a function is call-local state, not a registration memo.
      {
        code: `function f() { const m = new Map(); return createScopedComposable("thing", g, M); }`
      },
      // The scope module owns the registry and its cache.
      {
        code: `const registry = new Map();\nconst c = createScopedComposable(name, f, M);`,
        filename: "/repo/packages/headless/src/modules/scope/scope.builder.ts"
      }
    ],
    invalid: [
      // The incident's tell #1 — a template-literal name computed per variant.
      {
        code: "const c = createScopedComposable(`client-custom-fields@${objectType}`, f, M);",
        errors: [{ messageId: "computedName" }]
      },
      // Tell #1 again, behind a helper that returns the name.
      {
        code: `const c = createScopedComposable(qualifiedName(catalogue), f, M);`,
        errors: [{ messageId: "computedName" }]
      },
      // An identifier name is computed too — only a literal is legible to the registry.
      {
        code: `const c = createScopedComposable(name, f, M);`,
        errors: [{ messageId: "computedName" }]
      },
      // The incident's tell #2 — a module-scope registration memo beside the registrar.
      {
        code: `const registered = new Map();\nexport function useThing() { return createScopedComposable("thing", f, M); }`,
        errors: [{ messageId: "registrationMemo" }]
      },
      // Both tells at once, as FE-3034 actually shipped them.
      {
        code: "const registered = new Map();\nconst c = createScopedComposable(`thing@${v}`, f, M);",
        // Errors come back in source order, so the line-1 memo precedes the
        // line-2 name.
        errors: [
          { messageId: "registrationMemo" },
          { messageId: "computedName" }
        ]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("no-self-context", () => {
  const contractTypes =
    "/repo/packages/headless/src/modules/contract/contract.types.ts";
  const productTypes =
    "/repo/packages/headless/src/modules/contract-product/contract-product.types.ts";
  ruleTester.run("no-self-context", noSelfContext, {
    valid: [
      // Another entity the actor acts for is a context.
      {
        code: `export enum ContractsContextTypes { CLIENT = "client" }`,
        filename: contractTypes
      },
      // The module's own name outside a ContextTypes enum is not a context.
      {
        code: `export enum ContractStatus { CONTRACT = "contract" }`,
        filename: contractTypes
      },
      // Outside a module's types file the rule does not apply.
      {
        code: `export enum ContractContextTypes { CONTRACT = "contract" }`,
        filename: "/repo/packages/headless/src/modules/contract/useContract.ts"
      },
      // A context naming a different module is another entity.
      {
        code: `export enum ContractProductsContextTypes { CONTRACT = "contract" }`,
        filename: productTypes
      }
    ],
    invalid: [
      {
        code: `export enum ContractContextTypes { CONTRACT = "contract" }`,
        filename: contractTypes,
        errors: [{ messageId: "selfContext" }]
      },
      // "-" and "_" are treated alike.
      {
        code: `export enum ContractProductContextTypes { CONTRACT_PRODUCT = "contract_product" }`,
        filename: productTypes,
        errors: [{ messageId: "selfContext" }]
      },
      {
        code: `export enum ContractProductContextTypes { CONTRACT_PRODUCT = "contract-product", CLIENT = "client" }`,
        filename: productTypes,
        errors: [{ messageId: "selfContext" }]
      }
    ]
  });
});

const mod = "/repo/packages/headless/src/modules/foo/";

// ---------------------------------------------------------------------------
test("no-computed-effects", () => {
  ruleTester.run("no-computed-effects", noComputedEffects, {
    valid: [
      { code: `const x = computed(() => a.value + 1);` },
      { code: `const x = computed(() => (c ? a.value : b.value));` },
      {
        code: `const x = computed(() => { const y = a.value; return y * 2; });`
      },
      { code: `const x = computed(() => { const r = compute(); return r; });` },
      { code: `const x = computed(() => compute());` },
      {
        code: `const x = computed({ get: () => a.value, set: v => { a.value = v; } });`
      },
      {
        code: `const x = computed(() => items.value.map(i => { counter = i; return i; }));`
      },
      { code: `const x = computed(() => () => { log(); });` },
      { code: `a.value = 1; log(); count++;` }
    ],
    invalid: [
      {
        code: `const x = computed(() => { count.value = 1; return 2; });`,
        errors: [{ messageId: "assignment" }]
      },
      {
        code: `const x = computed(() => { total += 1; return total; });`,
        errors: [{ messageId: "assignment" }]
      },
      {
        code: `const x = computed(() => { count.value++; return 1; });`,
        errors: [{ messageId: "assignment" }]
      },
      {
        code: `const x = computed(() => { --count.value; return 1; });`,
        errors: [{ messageId: "assignment" }]
      },
      {
        code: `const x = computed(function () { seen = true; return 1; });`,
        errors: [{ messageId: "assignment" }]
      },
      {
        code: `const x = computed(() => { log(); return 1; });`,
        errors: [{ messageId: "bareCall" }]
      },
      {
        code: `const x = computed(() => { items.value.push(1); return 1; });`,
        errors: [{ messageId: "bareCall" }]
      },
      {
        code: `const x = computed({ get() { sideEffect(); return 1; }, set(v) {} });`,
        errors: [{ messageId: "bareCall" }]
      },
      {
        code: `const x = computed({ get: () => { seen = true; return 1; }, set: v => {} });`,
        errors: [{ messageId: "assignment" }]
      },
      {
        code: `const x = computed(() => { seen = true; log(); return 1; });`,
        errors: [{ messageId: "assignment" }, { messageId: "bareCall" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("no-local-state", () => {
  const billingDir = "modules/billing";
  const authDir = "modules/auth";
  fixture(`${billingDir}/useBilling.ts`, "export {};\n");
  fixture(`${authDir}/auth.machine.ts`, "export {};\n");
  fixture(`${authDir}/useAuth.ts`, "export {};\n");
  const billing = name => join(root, billingDir, name);
  const auth = name => join(root, authDir, name);
  ruleTester.run("no-local-state", noLocalState, {
    valid: [
      { code: `const a = ref(0);`, filename: auth("useAuth.ts") },
      { code: `const a = shallowRef(0);`, filename: auth("auth.services.ts") },
      { code: `const a = reactive({});`, filename: auth("useAuth.ts") },
      {
        code: `const a = computed(() => 1);`,
        filename: billing("useBilling.ts")
      },
      { code: `watch(src, () => {});`, filename: billing("useBilling.ts") },
      { code: `const a = ref(0);`, filename: billing("useBilling.test.ts") }
    ],
    invalid: [
      {
        code: `const a = ref(0);`,
        filename: billing("useBilling.ts"),
        errors: [{ messageId: "localState", data: { name: "ref" } }]
      },
      {
        code: `const a = shallowRef(0);`,
        filename: billing("useBilling.ts"),
        errors: [{ messageId: "localState", data: { name: "shallowRef" } }]
      },
      {
        code: `const a = reactive({});`,
        filename: billing("useBilling.ts"),
        errors: [{ messageId: "localState", data: { name: "reactive" } }]
      },
      {
        code: `export function load() { return ref(0); }`,
        filename: billing("billing.services.ts"),
        errors: [{ messageId: "localState" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("no-services-in-read-layers", () => {
  ruleTester.run("no-services-in-read-layers", noServicesInReadLayers, {
    valid: [
      {
        code: `export function createFooActions(services: FooServices) { return {}; }`,
        filename: `${mod}useFoo.actions.ts`
      },
      {
        code: `export function createFooActions(services) { return {}; }`,
        filename: `${mod}useFoo.actions.client.ts`
      },
      {
        code: `export function createFooMeta(state: State) { return {}; }`,
        filename: `${mod}useFoo.meta.ts`
      },
      {
        code: `export function createFooContext(state: State, config: Config) { return {}; }`,
        filename: `${mod}useFoo.context.ts`
      },
      {
        code: `export function createFooMeta(serviceKey: string, map: ServicesMap) { return {}; }`,
        filename: `${mod}useFoo.meta.ts`
      },
      {
        code: `function buildThing(services: FooServices) { return {}; }`,
        filename: `${mod}useFoo.meta.ts`
      }
    ],
    invalid: [
      {
        code: `export function createFooMeta(services: FooServices) { return {}; }`,
        filename: `${mod}useFoo.meta.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      },
      {
        code: `export function createFooContext(services) { return {}; }`,
        filename: `${mod}useFoo.context.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      },
      {
        code: `export function createFooMeta(service) { return {}; }`,
        filename: `${mod}useFoo.meta.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      },
      {
        code: `export function createFooMeta(SERVICES) { return {}; }`,
        filename: `${mod}useFoo.meta.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      },
      {
        code: `export function createFooMeta(s: FooServices) { return {}; }`,
        filename: `${mod}useFoo.meta.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      },
      {
        code: `export const createFooMeta = (state: State, services: unknown) => ({});`,
        filename: `${mod}useFoo.meta.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      },
      {
        code: `export function createFooContext(state: State, services = defaults) { return {}; }`,
        filename: `${mod}useFoo.context.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      },
      {
        code: `export function createFooMeta(services: FooServices) { return {}; }`,
        filename: `${mod}useFoo.meta.client.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      },
      {
        code: `export function createFooContext(services: FooServices) { return {}; }`,
        filename: `${mod}useFoo.context.staff.ts`,
        errors: [{ messageId: "servicesInReadLayer" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("machine-service-event-data", () => {
  const services = `${mod}foo.services.ts`;
  ruleTester.run("machine-service-event-data", machineServiceEventData, {
    valid: [
      {
        code: `export const load = async ({ token }, { data }: AnyEventObject) => data.id;`,
        filename: services
      },
      {
        code: `export const load = async (ctx, event) => event.type;`,
        filename: services
      },
      {
        code: `export const load = async () => { const res = await call(); return res.data; };`,
        filename: services
      },
      {
        code: `export const load = async (ctx, event) => event.data;`,
        filename: `${mod}foo.utils.ts`
      },
      {
        code: `export const load = async (ctx, event) => event.data;`,
        filename: `${mod}useFoo.ts`
      }
    ],
    invalid: [
      {
        code: `export const load = async (ctx, event) => event.data.id;`,
        filename: services,
        errors: [{ messageId: "eventData", data: { name: "event" } }]
      },
      {
        code: `export const load = async (ctx, _event) => _event.data;`,
        filename: services,
        errors: [{ messageId: "eventData", data: { name: "_event" } }]
      },
      {
        code: `export const load = async (ctx, event) => event?.data;`,
        filename: services,
        errors: [{ messageId: "eventData", data: { name: "event" } }]
      },
      {
        code: `export async function load(ctx, event) { const d = event.data; return d; }`,
        filename: services,
        errors: [{ messageId: "eventData" }]
      },
      {
        code: `export const load = async (ctx, event) => event.data;`,
        filename: `${mod}foo.services.client.ts`,
        errors: [{ messageId: "eventData" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("services-factory-fns", () => {
  const services = `${mod}foo.services.ts`;
  ruleTester.run("services-factory-fns", servicesFactoryFns, {
    valid: [
      {
        code: `export const createFooServices = () => ({ load: async () => 1, save: function () {}, remove() {}, helper, other: helperRef, ...rest });`,
        filename: services
      },
      {
        code: `export const createFooServices = () => ({ update: asyncDebounce(load) });`,
        filename: services
      },
      {
        code: `export function createFooServices() { return { load() {}, FOO_KEY: "foo" }; }`,
        filename: services
      },
      {
        code: `export const createFooServices = () => ({ scopeKey: "foo", queryKey: ["foo"], MAX_ITEMS: 5 });`,
        filename: services
      },
      {
        code: `export const createFooServices = () => ({ isReady: true, items: [], total: computed(() => 1) });`,
        filename: `${mod}foo.utils.ts`
      },
      {
        code: `export const useFoo = () => ({ isReady: true });`,
        filename: `${mod}useFoo.ts`
      }
    ],
    invalid: [
      {
        code: `export const createFooServices = () => ({ isReady: true });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember", data: { name: "isReady" } }]
      },
      {
        code: `export const createFooServices = () => ({ label: \`x\${y}\` });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export const createFooServices = () => ({ items: [] });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export const createFooServices = () => ({ options: {} });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export const createFooServices = () => ({ total: computed(() => 1) });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember", data: { name: "total" } }]
      },
      {
        code: `export const createFooServices = () => ({ count: ref(0) });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export const createFooServices = () => ({ cache: new Map() });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export const createFooServices = () => ({ sum: a + b });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export const createFooServices = () => ({ negated: !a });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export const createFooServices = () => ({ pick: a ? b : c });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export const createFooServices = () => ({ either: a || b });`,
        filename: services,
        errors: [{ messageId: "nonFunctionMember" }]
      },
      {
        code: `export function createFooServices() { return { load() {}, total: 1 }; }`,
        filename: `${mod}foo.services.client.ts`,
        errors: [{ messageId: "nonFunctionMember", data: { name: "total" } }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("return-order", () => {
  const file = `${mod}useFoo.ts`;
  ruleTester.run("return-order", returnOrder, {
    valid: [
      {
        code: `export function useFoo() { return { a, b, c }; }`,
        filename: file
      },
      {
        code: `export const useFoo = () => ({ a, b });`,
        filename: file
      },
      {
        code: `export function useFoo() { return { a, B, c }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { apple, Banana, cherry }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { a, b, ...rest }; }`,
        filename: file
      },
      {
        code: `export function useFoo() {\n  return {\n    // --- state\n    z,\n    // --- context\n    a,\n    // --- methods\n    d,\n    // --- utils\n    e\n  };\n}`,
        filename: file
      },
      {
        code: `export function useFoo() {\n  return {\n    // --- misc\n    z,\n    // --- state\n    a\n  };\n}`,
        filename: file
      },
      {
        code: `export function createFooMeta() { return { isA, isB }; }`,
        filename: `${mod}useFoo.meta.ts`
      },
      {
        code: `export function build() { return { b, a }; }`,
        filename: `${mod}foo.utils.ts`
      }
    ],
    invalid: [
      {
        code: `export function useFoo() { return { b, a }; }`,
        filename: file,
        errors: [{ messageId: "unsorted", data: { name: "a", previous: "b" } }]
      },
      {
        code: `export function useFoo() { return { a, c, b }; }`,
        filename: file,
        errors: [{ messageId: "unsorted" }]
      },
      {
        code: `export const useFoo = () => ({ b, a });`,
        filename: file,
        errors: [{ messageId: "unsorted" }]
      },
      {
        code: `export function useFoo() { return { b, A }; }`,
        filename: file,
        errors: [{ messageId: "unsorted" }]
      },
      {
        code: `export function useFoo() { return { B, a }; }`,
        filename: file,
        errors: [{ messageId: "unsorted" }]
      },
      {
        code: `export function createFooMeta() { return { isB, isA }; }`,
        filename: `${mod}useFoo.meta.ts`,
        errors: [{ messageId: "unsorted" }]
      },
      {
        code: `export function useFoo() {\n  return {\n    // --- state\n    a,\n    // --- context\n    z,\n    y\n  };\n}`,
        filename: file,
        errors: [{ messageId: "unsorted" }]
      },
      {
        code: `export function useFoo() {\n  return {\n    // --- methods\n    a,\n    // --- state\n    b\n  };\n}`,
        filename: file,
        errors: [{ messageId: "sectionOrder" }]
      },
      {
        code: `export function useFoo() {\n  return {\n    // --- utils\n    a,\n    // --- context\n    b\n  };\n}`,
        filename: file,
        errors: [{ messageId: "sectionOrder" }]
      },
      {
        code: `export function useFoo() { return { ...rest, a }; }`,
        filename: file,
        errors: [{ messageId: "spreadNotLast" }]
      },
      {
        code: `export function useFoo() { return { a, ...rest, b }; }`,
        filename: file,
        errors: [{ messageId: "spreadNotLast" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("no-inline-return-values", () => {
  const file = `${mod}useFoo.ts`;
  ruleTester.run("no-inline-return-values", noInlineReturnValues, {
    valid: [
      {
        code: `export function useFoo() { const total = computed(() => 1); function add() {} return { add, total }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { count: ref(0), name: "x", list: [] }; }`,
        filename: file
      },
      {
        code: `export const createFoo = () => ({ useActions: () => a, useContext: () => b, useInternals: () => c, useMeta: () => d });`,
        filename: file
      },
      {
        code: `export const createFoo = () => ({ useActions() {}, useMeta: computed(() => 1) });`,
        filename: file
      },
      {
        code: `const handlers = { f: () => 1, g: computed(() => 2) };`,
        filename: file
      },
      {
        code: `export function build() { return { f: () => 1, g: computed(() => 2) }; }`,
        filename: `${mod}foo.utils.ts`
      }
    ],
    invalid: [
      {
        code: `export function useFoo() { return { total: computed(() => 1) }; }`,
        filename: file,
        errors: [{ messageId: "inlineValue", data: { name: "total" } }]
      },
      {
        code: `export function useFoo() { return { add: () => 1 }; }`,
        filename: file,
        errors: [{ messageId: "inlineValue", data: { name: "add" } }]
      },
      {
        code: `export function useFoo() { return { add: function () {} }; }`,
        filename: file,
        errors: [{ messageId: "inlineValue" }]
      },
      {
        code: `export function useFoo() { return { add() {} }; }`,
        filename: file,
        errors: [{ messageId: "inlineValue" }]
      },
      {
        code: `export function useFoo() { return { async add() {} }; }`,
        filename: file,
        errors: [{ messageId: "inlineValue" }]
      },
      {
        code: `export const useFoo = () => ({ total: computed(() => 1) });`,
        filename: file,
        errors: [{ messageId: "inlineValue" }]
      },
      {
        code: `export const createFoo = () => ({ useOther: () => 1 });`,
        filename: file,
        errors: [{ messageId: "inlineValue", data: { name: "useOther" } }]
      },
      {
        code: `export function useFoo() { return { a: () => 1, b: computed(() => 2) }; }`,
        filename: file,
        errors: [{ messageId: "inlineValue" }, { messageId: "inlineValue" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("export-return-type", () => {
  const file = `${mod}useFoo.ts`;
  ruleTester.run("export-return-type", exportReturnType, {
    valid: [
      {
        code: `export function useFoo() { return {}; }\nexport type UseFoo = ReturnType<typeof useFoo>;`,
        filename: file
      },
      {
        code: `export const useFoo = () => ({});\nexport type UseFoo = ReturnType<typeof useFoo>;`,
        filename: file
      },
      {
        code: `export function useFoo() { return {}; }\nexport type Whatever = ReturnType<typeof useFoo>;`,
        filename: file
      },
      {
        code: `export function createFooActions() { return {}; }\nexport type FooActions = ReturnType<typeof createFooActions>;`,
        filename: `${mod}useFoo.actions.ts`
      },
      {
        code: `export function createFooContext() { return {}; }\nexport type FooContext = ReturnType<typeof createFooContext>;\nexport function createFooMeta() { return {}; }\nexport type FooMeta = ReturnType<typeof createFooMeta>;`,
        filename: `${mod}useFoo.context.ts`
      },
      {
        code: `function useHelper() { return {}; }`,
        filename: file
      },
      {
        code: `export function helper() { return {}; }\nexport function createFooBar() { return {}; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return {}; }`,
        filename: `${mod}foo.utils.ts`
      }
    ],
    invalid: [
      {
        code: `export function useFoo() { return {}; }`,
        filename: file,
        errors: [{ messageId: "missingReturnType", data: { name: "useFoo" } }]
      },
      {
        code: `export const useFoo = () => ({});`,
        filename: file,
        errors: [{ messageId: "missingReturnType" }]
      },
      {
        code: `export function useFoo() { return {}; }\ntype UseFoo = ReturnType<typeof useFoo>;`,
        filename: file,
        errors: [{ messageId: "missingReturnType" }]
      },
      {
        code: `export function useFoo() { return {}; }\nexport type UseFoo = ReturnType<typeof other>;`,
        filename: file,
        errors: [{ messageId: "missingReturnType" }]
      },
      {
        code: `export function createFooActions() { return {}; }`,
        filename: `${mod}useFoo.actions.ts`,
        errors: [
          { messageId: "missingReturnType", data: { name: "createFooActions" } }
        ]
      },
      {
        code: `export const createFooMeta = () => ({});`,
        filename: `${mod}useFoo.meta.ts`,
        errors: [{ messageId: "missingReturnType" }]
      },
      {
        code: `export function createFooInternals() { return {}; }`,
        filename: `${mod}useFoo.internals.ts`,
        errors: [{ messageId: "missingReturnType" }]
      },
      {
        code: `export function createFooContext() { return {}; }`,
        filename: `${mod}useFoo.context.ts`,
        errors: [{ messageId: "missingReturnType" }]
      },
      {
        code: `export function createFooContext() { return {}; }\nexport function createFooMeta() { return {}; }\nexport type FooContext = ReturnType<typeof createFooContext>;`,
        filename: `${mod}useFoo.context.ts`,
        errors: [
          { messageId: "missingReturnType", data: { name: "createFooMeta" } }
        ]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("pagination-shape", () => {
  const file = `${mod}useFoo.ts`;
  ruleTester.run("pagination-shape", paginationShape, {
    valid: [
      {
        code: `export function useFoo() { const pagination = computed(() => ({ offset: 0, limit: 10, total: 5 })); return { pagination }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { pagination: computed(() => ({ limit: 1, offset: 0, total: 2 })) }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { const pagination = computed(() => { return { total, limit, offset }; }); return { pagination }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { pagination: somePagination }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { pagination: usePagination() }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { const pagination = ref({ page: 1 }); return { pagination }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { paging: computed(() => ({ page: 1 })) }; }`,
        filename: file
      },
      {
        code: `export function build() { return { pagination: computed(() => ({ page: 1 })) }; }`,
        filename: `${mod}foo.utils.ts`
      }
    ],
    invalid: [
      {
        code: `export function useFoo() { return { pagination: computed(() => ({ offset: 0, limit: 10, total: 5, page: 1 })) }; }`,
        filename: file,
        errors: [{ messageId: "paginationShape" }]
      },
      {
        code: `export function useFoo() { return { pagination: computed(() => ({ offset: 0, limit: 10 })) }; }`,
        filename: file,
        errors: [{ messageId: "paginationShape" }]
      },
      {
        code: `export function useFoo() { return { pagination: computed(() => ({ offset: 0, limit: 10, count: 5 })) }; }`,
        filename: file,
        errors: [{ messageId: "paginationShape" }]
      },
      {
        code: `export function useFoo() { const pagination = computed(() => ({ page: 1, size: 10 })); return { pagination }; }`,
        filename: file,
        errors: [{ messageId: "paginationShape" }]
      },
      {
        code: `export function useFoo() { const pagination = computed(() => { return { offset, limit }; }); return { pagination }; }`,
        filename: file,
        errors: [{ messageId: "paginationShape" }]
      },
      {
        code: `export const useFoo = () => ({ pagination: computed(() => ({})) });`,
        filename: file,
        errors: [{ messageId: "paginationShape" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("no-meta-object", () => {
  const file = `${mod}useFoo.ts`;
  ruleTester.run("no-meta-object", noMetaObject, {
    valid: [
      {
        code: `export function useFoo() { return { isReady: computed(() => true) }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { meta: computed(() => true) }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { meta: otherMeta }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { const meta = computed(() => flags.value); return { meta }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { const meta = reactive({ a: 1 }); return { meta }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { meta: { a: 1 } }; }`,
        filename: file
      },
      {
        code: `export function build() { return { meta: computed(() => ({ a: 1 })) }; }`,
        filename: `${mod}foo.utils.ts`
      }
    ],
    invalid: [
      {
        code: `export function useFoo() { return { meta: computed(() => ({ isA: true })) }; }`,
        filename: file,
        errors: [{ messageId: "metaObject" }]
      },
      {
        code: `export function useFoo() { const meta = computed(() => ({ isA: true })); return { meta }; }`,
        filename: file,
        errors: [{ messageId: "metaObject" }]
      },
      {
        code: `export function useFoo() { const meta = computed(() => { const a = 1; return { isA: a }; }); return { meta }; }`,
        filename: file,
        errors: [{ messageId: "metaObject" }]
      },
      {
        code: `export const useFoo = () => ({ meta: computed(() => ({ isA: true })) });`,
        filename: file,
        errors: [{ messageId: "metaObject" }]
      },
      {
        code: `export function useFoo() { return { meta: computed(() => { return { isA: true }; }) }; }`,
        filename: file,
        errors: [{ messageId: "metaObject" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("meta-flag-name", () => {
  const file = `${mod}useFoo.meta.ts`;
  ruleTester.run("meta-flag-name", metaFlagName, {
    valid: [
      {
        code: `export function createFooMeta() { return { isReady, hasItems, canEdit, showBanner }; }`,
        filename: file
      },
      {
        code: `export function createFooMeta() { return { isReady: computed(() => true), ...rest }; }`,
        filename: file
      },
      {
        code: `export function createFooMeta() { return { isReady }; }`,
        filename: `${mod}useFoo.meta.client.ts`
      },
      {
        code: `export function createFooActions() { return { ready, save }; }`,
        filename: `${mod}useFoo.actions.ts`
      },
      {
        code: `export function useFoo() { return { ready }; }`,
        filename: `${mod}useFoo.ts`
      },
      {
        code: `export function createFooMeta() { return { needsAuth }; }`,
        filename: file,
        options: [{ prefixes: ["needs"] }]
      }
    ],
    invalid: [
      {
        code: `export function createFooMeta() { return { ready }; }`,
        filename: file,
        errors: [{ messageId: "flagName" }]
      },
      {
        code: `export function createFooMeta() { return { isolated }; }`,
        filename: file,
        errors: [{ messageId: "flagName" }]
      },
      {
        code: `export function createFooMeta() { return { is }; }`,
        filename: file,
        errors: [{ messageId: "flagName" }]
      },
      {
        code: `export function createFooMeta() { return { hasitems }; }`,
        filename: file,
        errors: [{ messageId: "flagName" }]
      },
      {
        code: `export function createFooMeta() { return { shown }; }`,
        filename: file,
        errors: [{ messageId: "flagName" }]
      },
      {
        code: `export function createFooMeta() { return { canonical }; }`,
        filename: file,
        errors: [{ messageId: "flagName" }]
      },
      {
        code: `export function createFooMeta() { return { isReady, editable }; }`,
        filename: file,
        errors: [{ messageId: "flagName" }]
      },
      {
        code: `export function createFooMeta() { return { total: computed(() => 1) }; }`,
        filename: `${mod}useFoo.meta.staff.ts`,
        errors: [{ messageId: "flagName" }]
      },
      {
        code: `export function createFooMeta() { return { isReady }; }`,
        filename: file,
        options: [{ prefixes: ["needs"] }],
        errors: [{ messageId: "flagName" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("is-ready-contract", () => {
  const actions = `${mod}useFoo.actions.ts`;
  ruleTester.run("is-ready-contract", isReadyContract, {
    valid: [
      {
        code: `export function createFooActions() { const isReady = async () => true; return { isReady }; }`,
        filename: actions
      },
      {
        code: `export function createFooActions() { async function isReady() { return true; } return { isReady }; }`,
        filename: actions
      },
      {
        code: `export function createFooActions() { function isReady(): Promise<boolean> { return p; } return { isReady }; }`,
        filename: actions
      },
      {
        code: `export function createFooActions() { const isReady = (): Promise<boolean> => p; return { isReady }; }`,
        filename: actions
      },
      {
        code: `export function createFooActions() { const isReady = async () => true; return { destroy, isReady, onDone, refresh }; }`,
        filename: actions
      },
      {
        code: `export function createFooActions() { return { destroy, refresh }; }`,
        filename: `${mod}useFoo.actions.client.ts`
      },
      {
        code: `export function createFooMeta() { return { isReadyFlag, canEdit }; }`,
        filename: `${mod}useFoo.meta.ts`
      }
    ],
    invalid: [
      {
        code: `export function createFooActions() { return { save }; }`,
        filename: actions,
        errors: [
          { messageId: "missingIsReady", data: { name: "createFooActions" } }
        ]
      },
      {
        code: `export const createFooActions = () => ({ save });`,
        filename: actions,
        errors: [{ messageId: "missingIsReady" }]
      },
      {
        code: `export function createFooMeta() { return { destroy }; }`,
        filename: `${mod}useFoo.meta.ts`,
        errors: [{ messageId: "wrongLayer" }]
      },
      {
        code: `export function createFooContext() { return { onDone }; }`,
        filename: `${mod}useFoo.context.ts`,
        errors: [{ messageId: "wrongLayer" }]
      },
      {
        code: `export function createFooInternals() { return { refresh }; }`,
        filename: `${mod}useFoo.internals.ts`,
        errors: [{ messageId: "wrongLayer" }]
      },
      {
        code: `export function createFooMeta() { return { isReady }; }`,
        filename: `${mod}useFoo.meta.client.ts`,
        errors: [{ messageId: "wrongLayer" }]
      },
      {
        code: `export function createFooActions() { function isReady() { return true; } return { isReady }; }`,
        filename: actions,
        errors: [{ messageId: "isReadyType" }]
      },
      {
        code: `export function createFooActions() { const isReady = () => true; return { isReady }; }`,
        filename: actions,
        errors: [{ messageId: "isReadyType" }]
      },
      {
        code: `export function createFooActions() { function isReady(): boolean { return true; } return { isReady }; }`,
        filename: actions,
        errors: [{ messageId: "isReadyType" }]
      },
      {
        code: `export function createFooActions() { function isReady(): Promise<string> { return p; } return { isReady }; }`,
        filename: actions,
        errors: [{ messageId: "isReadyType" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("on-done-unsubscribes", () => {
  const file = `${mod}useFoo.actions.ts`;
  ruleTester.run("on-done-unsubscribes", onDoneUnsubscribes, {
    valid: [
      {
        code: `function onDone(cb) { const stop = watch(src, cb); onScopeDispose(stop); }`,
        filename: file
      },
      {
        code: `const onDone = cb => { onUnmounted(() => off(cb)); };`,
        filename: file
      },
      {
        code: `const onDone = function (cb) { tryOnScopeDispose(() => off(cb)); };`,
        filename: file
      },
      {
        code: `export function createFooActions() { return { onDone: cb => { onScopeDispose(() => off(cb)); } }; }`,
        filename: file
      },
      {
        code: `export function createFooActions() { return { onDone(cb) { onScopeDispose(() => off(cb)); } }; }`,
        filename: file
      },
      {
        code: `function onDone(cb) { const stop = bus.on(() => { onScopeDispose(cb); }); }`,
        filename: file
      },
      {
        code: `import { onDone } from "./shared";\nexport function createFooActions() { return { onDone }; }`,
        filename: file
      },
      {
        code: `export function createFooActions() { return { onDone: externalOnDone }; }`,
        filename: file
      },
      {
        code: `function onFinished(cb) { listeners.push(cb); }`,
        filename: file
      },
      {
        code: `function onDone(cb) { listeners.push(cb); }`,
        filename: `${mod}foo.utils.ts`
      }
    ],
    invalid: [
      {
        code: `function onDone(cb) { listeners.push(cb); }`,
        filename: file,
        errors: [{ messageId: "noUnsubscribe" }]
      },
      {
        code: `async function onDone(cb) { bus.on(cb); }`,
        filename: file,
        errors: [{ messageId: "noUnsubscribe" }]
      },
      {
        code: `const onDone = cb => { bus.on(cb); };`,
        filename: file,
        errors: [{ messageId: "noUnsubscribe" }]
      },
      {
        code: `const onDone = cb => bus.on(cb);`,
        filename: file,
        errors: [{ messageId: "noUnsubscribe" }]
      },
      {
        code: `const onDone = function (cb) { bus.on(cb); };`,
        filename: file,
        errors: [{ messageId: "noUnsubscribe" }]
      },
      {
        code: `export function createFooActions() { return { onDone: cb => { bus.on(cb); } }; }`,
        filename: file,
        errors: [{ messageId: "noUnsubscribe" }]
      },
      {
        code: `export function createFooActions() { return { onDone(cb) { bus.on(cb); } }; }`,
        filename: file,
        errors: [{ messageId: "noUnsubscribe" }]
      },
      {
        code: `function onDone(cb) { dispose(cb); }`,
        filename: file,
        errors: [{ messageId: "noUnsubscribe" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("file-names", () => {
  const at = name => `${mod}${name}`;
  ruleTester.run("file-names", fileNames, {
    valid: [
      { code: ``, filename: at("useFoo.ts") },
      { code: ``, filename: at("useFoo.actions.ts") },
      { code: ``, filename: at("useFoo.meta.client.ts") },
      { code: ``, filename: at("useFoo.internals.guest.ts") },
      { code: ``, filename: at("useFoo.context.staff.ts") },
      { code: ``, filename: at("foo.machine.ts") },
      { code: ``, filename: at("foo.services.client.ts") },
      { code: ``, filename: at("foo.types.ts") },
      { code: ``, filename: at("foo-bar.types.ts") },
      { code: ``, filename: at("index.ts") },
      { code: ``, filename: at("__tests__/Anything.ts") },
      { code: ``, filename: at("docs/Notes.ts") }
    ],
    invalid: [
      {
        code: ``,
        filename: at("useFoo.base.ts"),
        errors: [{ messageId: "noBase" }]
      },
      {
        code: ``,
        filename: at("foo.base.ts"),
        errors: [{ messageId: "noBase" }]
      },
      {
        code: ``,
        filename: at("Foo.ts"),
        errors: [{ messageId: "badName" }]
      },
      {
        code: ``,
        filename: at("foo.ts"),
        errors: [{ messageId: "badName" }]
      },
      {
        code: ``,
        filename: at("fooMachine.ts"),
        errors: [{ messageId: "badName" }]
      },
      {
        code: ``,
        filename: at("foo_services.ts"),
        errors: [{ messageId: "badName" }]
      },
      {
        code: ``,
        filename: at("useFoo.layers.ts"),
        errors: [{ messageId: "badName" }]
      },
      {
        code: ``,
        filename: at("useFoo.actions.admin.ts"),
        errors: [{ messageId: "badName" }]
      },
      {
        code: ``,
        filename: at("usefoo.ts"),
        errors: [{ messageId: "badName" }]
      },
      {
        code: ``,
        filename: at("helpers.ts"),
        errors: [{ messageId: "badName" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("query-client-inside", () => {
  ruleTester.run("query-client-inside", queryClientInside, {
    valid: [
      { code: `function useFoo() { const qc = useQueryClient(); return qc; }` },
      { code: `function createFooActions(state: State) { return {}; }` },
      { code: `function useFoo(qc: SomethingElse) { return qc; }` },
      { code: `function invalidate(qc: QueryClient) { qc.clear(); }` },
      { code: `const refresh = (qc: QueryClient) => qc.clear();` }
    ],
    invalid: [
      {
        code: `function useFoo(client: QueryClient) { return client; }`,
        errors: [{ messageId: "queryClientParam", data: { name: "useFoo" } }]
      },
      {
        code: `const createFooActions = (client: QueryClient) => ({});`,
        errors: [{ messageId: "queryClientParam" }]
      },
      {
        code: `function createFooMeta(state: State, client: QueryClient) { return {}; }`,
        errors: [{ messageId: "queryClientParam" }]
      },
      {
        code: `function useFoo(client: QueryClient = fallback) { return client; }`,
        errors: [{ messageId: "queryClientParam" }]
      },
      {
        code: `const useFoo = function (client: QueryClient) { return client; };`,
        errors: [{ messageId: "queryClientParam" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("destroy-removes-key", () => {
  const file = `${mod}useFoo.actions.ts`;
  ruleTester.run("destroy-removes-key", destroyRemovesKey, {
    valid: [
      {
        code: `export function createFooActions(scopeKey: string) { function destroy() { registry.remove(scopeKey); } return { destroy }; }`,
        filename: file
      },
      {
        code: `export function createFooActions(scopeKey: string) { const destroy = () => { scopes.delete(scopeKey); }; return { destroy }; }`,
        filename: file
      },
      {
        code: `export function createFooActions(scopeKey = "x") { function destroy() { remove(scopeKey); } return { destroy }; }`,
        filename: file
      },
      {
        code: `export function createFooActions(scopeKey: string) { return { destroy: () => { unregister(scopeKey); } }; }`,
        filename: file
      },
      {
        code: `export function createFooActions(scopeKey: string) { return { destroy() { remove(scopeKey); } }; }`,
        filename: file
      },
      {
        code: `export function createFooActions() { return { save }; }`,
        filename: file
      },
      {
        code: `export function createFooActions() { function destroy() { cleanup(); } return { destroy }; }`,
        filename: `${mod}useFoo.actions.client.ts`
      },
      {
        code: `export function createFooMeta() { function destroy() { cleanup(); } return { destroy }; }`,
        filename: `${mod}useFoo.meta.ts`
      }
    ],
    invalid: [
      {
        code: `export function createFooActions(scopeKey: string) { function destroy() { cleanup(); } return { destroy }; }`,
        filename: file,
        errors: [{ messageId: "noRemove" }]
      },
      {
        code: `export function createFooActions(scopeKey: string) { const destroy = () => {}; return { destroy }; }`,
        filename: file,
        errors: [{ messageId: "noRemove" }]
      },
      {
        code: `export function createFooActions(scopeKey: string) { function destroy() { remove(); } return { destroy }; }`,
        filename: file,
        errors: [{ messageId: "noRemove" }]
      },
      {
        code: `export function createFooActions(scopeKey: string) { function destroy() { remove(key); } return { destroy }; }`,
        filename: file,
        errors: [{ messageId: "noRemove" }]
      },
      {
        code: `export function createFooActions(scopeKey: string) { function destroy() { const k = scopeKey; return k; } return { destroy }; }`,
        filename: file,
        errors: [{ messageId: "noRemove" }]
      },
      {
        code: `export function createFooActions(scopeKey: string) { return { destroy: () => {} }; }`,
        filename: file,
        errors: [{ messageId: "noRemove" }]
      },
      {
        code: `export function createFooActions() { function destroy() { remove(scopeKey); } return { destroy }; }`,
        filename: file,
        errors: [{ messageId: "noScopeKey" }]
      },
      {
        code: `export function createFooActions(key: string) { function destroy() { remove(scopeKey); } return { destroy }; }`,
        filename: file,
        errors: [{ messageId: "noScopeKey" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("state-paths-resolve", () => {
  fixture(
    "modules/billing/billing.machine.ts",
    `export const billingMachine = setup({}).createMachine({ context: { invoiceId: null, items: [] }, initial: "idle", states: { idle: {}, loading: { states: { fetching: {} } }, ready: {} } });\n`
  );
  fixture(
    "modules/other/other.machine.ts",
    `export const otherMachine = setup({}).createMachine({ initial: "settled", states: { settled: {} } });\n`
  );
  const file = join(root, "modules/billing/useBilling.ts");
  const plain = join(root, "modules/plain/usePlain.ts");
  fixture("modules/plain/usePlain.ts", "export {};\n");
  ruleTester.run("state-paths-resolve", statePathsResolve, {
    valid: [
      { code: `stateMatches(state, "ready");`, filename: file },
      { code: `stateMatches(state, "loading.fetching");`, filename: file },
      { code: `state.matches("idle");`, filename: file },
      { code: `state.matches(["idle", "ready"]);`, filename: file },
      { code: `contextValue(state, "invoiceId");`, filename: file },
      { code: `contextValue(state, "items.0.ghost");`, filename: file },
      { code: `stateMatches(state, "settled");`, filename: file },
      { code: `stateMatches(state, path);`, filename: file },
      {
        code: `waitFor(actor, s => stateMatches(s, "ready"));`,
        filename: file
      },
      { code: `stateMatches(state, "ghost");`, filename: plain }
    ],
    invalid: [
      {
        code: `stateMatches(state, "ghost");`,
        filename: file,
        errors: [
          {
            messageId: "unknownPath",
            data: { segment: "ghost", path: "ghost" }
          }
        ]
      },
      {
        code: `stateMatches(state, "loading.ghost");`,
        filename: file,
        errors: [
          {
            messageId: "unknownPath",
            data: { segment: "ghost", path: "loading.ghost" }
          }
        ]
      },
      {
        code: `state.matches("ghost");`,
        filename: file,
        errors: [{ messageId: "unknownPath" }]
      },
      {
        code: `state.matches(["idle", "ghost"]);`,
        filename: file,
        errors: [{ messageId: "unknownPath" }]
      },
      {
        code: `contextValue(state, "ghost");`,
        filename: file,
        errors: [{ messageId: "unknownPath" }]
      },
      {
        code: `contextValue(state, "ghost.items");`,
        filename: file,
        errors: [{ messageId: "unknownPath" }]
      },
      {
        code: `waitFor(actor, s => stateMatches(s, "nope"));`,
        filename: file,
        errors: [{ messageId: "unknownPath" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("scope-naming", () => {
  const file = `${mod}useFoo.ts`;
  const types = `${mod}foo.types.ts`;
  ruleTester.run("scope-naming", scopeNaming, {
    valid: [
      {
        code: `export function useFoo() { return { scopeActor: actorScope, scopeContext: config.context }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { scopeActor: computed(() => actorScope) }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { const scopeActor = actorScope; return { scopeActor }; }`,
        filename: file
      },
      {
        code: `export function useFoo() { return { actor: somethingElse, context: config.other }; }`,
        filename: file
      },
      {
        code: `export const FOO_SCOPE_MATRIX = { [ScopeActorTypes.CLIENT]: {} } as const;`,
        filename: types
      },
      {
        code: `export const BILLING_PLAN_SCOPE_MATRIX = { [ScopeActorTypes.STAFF]: {} } satisfies Matrix;`,
        filename: types
      },
      {
        code: `export const FOO_SCOPE_MATRIX = { [ScopeActorTypes.CLIENT]: {} };`,
        filename: file
      },
      { code: `const defaults = { [KEYS.A]: 1 };`, filename: file },
      { code: `const defaults = { a: 1 };`, filename: types },
      {
        code: `const matrix = { [ScopeActorTypes.CLIENT]: {} };`,
        filename: `${mod}foo.utils.ts`
      }
    ],
    invalid: [
      {
        code: `export function useFoo() { return { actor: actorScope }; }`,
        filename: file,
        errors: [{ messageId: "scopeActor" }]
      },
      {
        code: `export function useFoo() { return { currentActor: computed(() => actorScope) }; }`,
        filename: file,
        errors: [{ messageId: "scopeActor" }]
      },
      {
        code: `export function useFoo() { return { actorScope }; }`,
        filename: file,
        errors: [{ messageId: "scopeActor" }]
      },
      {
        code: `export function useFoo() { return { context: config.context }; }`,
        filename: file,
        errors: [{ messageId: "scopeContext" }]
      },
      {
        code: `export function useFoo() { return { target: config.context }; }`,
        filename: file,
        errors: [{ messageId: "scopeContext" }]
      },
      {
        code: `export const FOO_MATRIX = { [ScopeActorTypes.CLIENT]: {} };`,
        filename: types,
        errors: [{ messageId: "matrixName" }]
      },
      {
        code: `export const fooMatrix = { [ScopeActorTypes.CLIENT]: {} } as const;`,
        filename: types,
        errors: [{ messageId: "matrixName" }]
      },
      {
        code: `const matrix = { [ScopeActorTypes.CLIENT]: {} } satisfies Matrix;`,
        filename: file,
        errors: [{ messageId: "matrixName" }]
      },
      {
        code: `export const SCOPE_MATRIX = { [ScopeActorTypes.CLIENT]: {} };`,
        filename: types,
        errors: [{ messageId: "matrixName" }]
      },
      {
        code: `export const foo_SCOPE_MATRIX = { [ScopeActorTypes.CLIENT]: {} };`,
        filename: types,
        errors: [{ messageId: "matrixName" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("scoped-factory", () => {
  for (const layer of ["actions", "context", "internals", "meta"]) {
    fixture(`modules/foo/useFoo.${layer}.ts`, "export {};\n");
  }
  fixture("modules/foo/useFoo.ts", "export {};\n");
  fixture("modules/bar/useBar.ts", "export {};\n");
  fixture("modules/bar/useBar.actions.ts", "export {};\n");
  const foo = join(root, "modules/foo/useFoo.ts");
  const bar = join(root, "modules/bar/useBar.ts");
  const layers = `{ useActions, useContext, useInternals, useMeta }`;
  ruleTester.run("scoped-factory", scopedFactory, {
    valid: [
      {
        code: `function createFoo() { return ${layers}; }\nexport const useFoo = createScopedComposable("foo", createFoo, FOO_SCOPE_MATRIX);`,
        filename: foo
      },
      {
        code: `export const useFoo = createScopedComposable("foo", () => ({ useActions: () => a, useContext: () => b, useInternals: () => c, useMeta: () => d }), FOO_SCOPE_MATRIX);`,
        filename: foo
      },
      {
        code: `export const useFoo = createScopedComposable("foo", function () { return ${layers}; }, FOO_SCOPE_MATRIX);`,
        filename: foo
      },
      {
        code: `export const useFoo = createScopedComposable("foo", () => ({ useMeta, useInternals, useContext, useActions }), FOO_SCOPE_MATRIX);`,
        filename: foo
      },
      {
        code: `export const useFoo = createScopedComposable("foo", () => ${layers}, STATS_SCOPE_MATRIX);`,
        filename: foo
      },
      {
        code: `export const useBar = createScopedComposable("bar", () => ({}));`,
        filename: bar
      },
      {
        code: `export function useBar() { return {}; }`,
        filename: bar
      },
      {
        code: `export function useFoo() { return {}; }`,
        filename: join(root, "modules/foo/useFoo.actions.ts")
      }
    ],
    invalid: [
      {
        code: `export const useFoo = createScopedComposable("foo", () => ${layers});`,
        filename: foo,
        errors: [{ messageId: "matrixValue" }]
      },
      {
        code: `export const useFoo = createScopedComposable("foo", () => ${layers}, {});`,
        filename: foo,
        errors: [{ messageId: "matrixName" }]
      },
      {
        code: `export const useFoo = createScopedComposable("foo", () => ${layers}, statsMatrix);`,
        filename: foo,
        errors: [{ messageId: "matrixName" }]
      },
      {
        code: `export function useFoo() { return {}; }`,
        filename: foo,
        errors: [{ messageId: "notScoped" }]
      },
      {
        code: `export const useFoo = () => ({ useActions, useContext, useInternals, useMeta });`,
        filename: foo,
        errors: [{ messageId: "notScoped" }]
      },
      {
        code: `export const useFoo = createScopedComposable("foo", () => ({ useActions, useContext, useMeta }), FOO_SCOPE_MATRIX);`,
        filename: foo,
        errors: [{ messageId: "layerKeys" }]
      },
      {
        code: `export const useFoo = createScopedComposable("foo", () => ({ useActions, useContext, useInternals, useMeta, count }), FOO_SCOPE_MATRIX);`,
        filename: foo,
        errors: [{ messageId: "layerKeys" }]
      },
      {
        code: `export const useFoo = createScopedComposable("foo", () => ({ count, total }), FOO_SCOPE_MATRIX);`,
        filename: foo,
        errors: [{ messageId: "layerKeys" }]
      },
      {
        code: `function createFoo() { return { useActions, useContext }; }\nexport const useFoo = createScopedComposable("foo", createFoo, FOO_SCOPE_MATRIX);`,
        filename: foo,
        errors: [{ messageId: "layerKeys" }]
      },
      {
        code: `export const useFoo = createScopedComposable("foo", function () { return { useActions, useMeta }; }, FOO_SCOPE_MATRIX);`,
        filename: foo,
        errors: [{ messageId: "layerKeys" }]
      }
    ]
  });
});

// ---------------------------------------------------------------------------
test("no-local-query-type", () => {
  const file = `${mod}useFoo.ts`;
  ruleTester.run("no-local-query-type", noLocalQueryType, {
    valid: [
      {
        code: `type X = ReturnType<typeof computeTotal>;`,
        filename: file
      },
      { code: `type X = ReturnType<typeof useFoo>;`, filename: file },
      { code: `type Y = string;`, filename: file },
      { code: `type L = ListQuery<Foo>;`, filename: file },
      {
        code: `type X = Awaited<ReturnType<typeof computeTotal>>;`,
        filename: file
      },
      {
        code: `export type Q = ReturnType<typeof useQuery>;`,
        filename: "/repo/packages/headless/src/modules/query/query.ts"
      }
    ],
    invalid: [
      {
        code: `type Q = ReturnType<typeof useQuery>;`,
        filename: file,
        errors: [{ messageId: "localQueryType", data: { fn: "useQuery" } }]
      },
      {
        code: `export type M = ReturnType<typeof useMutation>;`,
        filename: file,
        errors: [{ messageId: "localQueryType", data: { fn: "useMutation" } }]
      },
      {
        code: `type Q = ReturnType<typeof useListQuery>;`,
        filename: file,
        errors: [{ messageId: "localQueryType" }]
      },
      {
        code: `type M = ReturnType<typeof createFooMutation>;`,
        filename: file,
        errors: [{ messageId: "localQueryType" }]
      },
      {
        code: `type L = ReturnType<typeof loadList>;`,
        filename: file,
        errors: [{ messageId: "localQueryType", data: { fn: "loadList" } }]
      },
      {
        code: `type Q = ReturnType<typeof api.useFooQuery>;`,
        filename: file,
        errors: [{ messageId: "localQueryType", data: { fn: "useFooQuery" } }]
      }
    ]
  });
});
