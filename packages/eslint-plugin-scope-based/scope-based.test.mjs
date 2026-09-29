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
        code:
          "const c = createScopedComposable(`client-custom-fields@${objectType}`, f, M);",
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
        code:
          "const registered = new Map();\nconst c = createScopedComposable(`thing@${v}`, f, M);",
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
  const contractTypes = "/repo/packages/headless/src/modules/contract/contract.types.ts";
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
