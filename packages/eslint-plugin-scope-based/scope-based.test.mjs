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
import armInMatrix from "./rules/arm-in-matrix.mjs";

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
