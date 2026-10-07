/**
 * @fileoverview `tests` — the ESLint plugin enforcing the test rules
 * (`code-tests`, `code-tests-e2e`) for unit, integration and e2e test files, the
 * journeys suite (`tests/journeys/**`) and the test-id contract. The old
 * `tests/Playwright/**` suite is frozen and stays ignored (D4); scoping lives
 * in the root `eslint.config.mjs`, not in the rules.
 *
 *   Every test file
 *   no-type-shape-assert        — assert behaviour, not shape
 *   no-bare-called              — a called-assert needs the data the mock received
 *   no-fixed-wait               — wait for the request or the state, never sleep
 *   file-header                 — JSDoc header: @fileoverview, JTBD, what breaks
 *   file-name                   — <source-base>[.<actor>].<layer>.test.ts
 *   one-replay-int-test         — a headless module keeps <module>.replay.int.test.ts
 *   int-replay-only             — module tests answer only from recordings, never msw or an edited recording
 *   fixtures-shared-recorder    — a module recorder uses Generator and the auth tokens, never its own login
 *
 *   e2e specs and support (tests/journeys/**)
 *   e2e-test-id-locators-only   — locate by test id, never by copy
 *   e2e-no-text-assert          — assert presence, not text
 *   e2e-test-id-attribute       — the test-id attribute is the Playwright config's
 *   e2e-no-own-http             — a test file makes no HTTP call of its own
 *   e2e-no-external-goto        — stay inside the app under test
 *   e2e-no-spec-retries         — the config sets retries, a spec never does
 *   e2e-serial-needs-reason     — serial mode carries a reason; parallel is the default
 *   e2e-unroute-cleanup         — page.route needs an afterEach unrouteAll
 *   e2e-spec-file-kebab         — a spec file name is kebab-case
 *   e2e-no-inline-helpers       — a spec declares no top-level helper
 *   e2e-no-journey-mock         — mock settings, never journey data
 *
 *   Production source
 *   test-attrs-only-divergence  — useTestAttrs is the only test-mode branch
 *
 * @module packages/eslint-plugin-tests
 */

import noTypeShapeAssert from "./rules/no-type-shape-assert.mjs";
import noBareCalled from "./rules/no-bare-called.mjs";
import noFixedWait from "./rules/no-fixed-wait.mjs";
import fileHeader from "./rules/file-header.mjs";
import fileName from "./rules/file-name.mjs";
import oneReplayIntTest from "./rules/one-replay-int-test.mjs";
import intReplayOnly from "./rules/int-replay-only.mjs";
import fixturesSharedRecorder from "./rules/fixtures-shared-recorder.mjs";
import e2eTestIdLocatorsOnly from "./rules/e2e-test-id-locators-only.mjs";
import e2eNoTextAssert from "./rules/e2e-no-text-assert.mjs";
import e2eTestIdAttribute from "./rules/e2e-test-id-attribute.mjs";
import e2eNoOwnHttp from "./rules/e2e-no-own-http.mjs";
import e2eNoExternalGoto from "./rules/e2e-no-external-goto.mjs";
import e2eNoSpecRetries from "./rules/e2e-no-spec-retries.mjs";
import e2eSerialNeedsReason from "./rules/e2e-serial-needs-reason.mjs";
import e2eUnrouteCleanup from "./rules/e2e-unroute-cleanup.mjs";
import e2eSpecFileKebab from "./rules/e2e-spec-file-kebab.mjs";
import e2eNoInlineHelpers from "./rules/e2e-no-inline-helpers.mjs";
import e2eNoJourneyMock from "./rules/e2e-no-journey-mock.mjs";
import testAttrsOnlyDivergence from "./rules/test-attrs-only-divergence.mjs";

const plugin = {
  meta: { name: "tests", version: "1.0.0" },
  rules: {
    "no-type-shape-assert": noTypeShapeAssert,
    "no-bare-called": noBareCalled,
    "no-fixed-wait": noFixedWait,
    "file-header": fileHeader,
    "file-name": fileName,
    "one-replay-int-test": oneReplayIntTest,
    "int-replay-only": intReplayOnly,
    "fixtures-shared-recorder": fixturesSharedRecorder,
    "e2e-test-id-locators-only": e2eTestIdLocatorsOnly,
    "e2e-no-text-assert": e2eNoTextAssert,
    "e2e-test-id-attribute": e2eTestIdAttribute,
    "e2e-no-own-http": e2eNoOwnHttp,
    "e2e-no-external-goto": e2eNoExternalGoto,
    "e2e-no-spec-retries": e2eNoSpecRetries,
    "e2e-serial-needs-reason": e2eSerialNeedsReason,
    "e2e-unroute-cleanup": e2eUnrouteCleanup,
    "e2e-spec-file-kebab": e2eSpecFileKebab,
    "e2e-no-inline-helpers": e2eNoInlineHelpers,
    "e2e-no-journey-mock": e2eNoJourneyMock,
    "test-attrs-only-divergence": testAttrsOnlyDivergence
  }
};

export default plugin;
