// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE (EXTENSION) — doctrine wins over this fragment and the one
 * built generator it cites. Authority: ADR 035
 * (`docs/adr/035-one-scenario-one-recording.md`) and
 * `packages/headless/src/testing/scenario-fixtures.ts`.
 *
 * APPENDED by the PROVER seat to the module's EXISTING generator,
 * `packages/headless/src/modules/<module>/__tests__/<module>.fixtures.ts`,
 * after its existing `describe`. It reuses that file's `API_URL`, `ORIGIN`,
 * uncaptured `call` helper and token minting — never a second recorder.
 *
 * ONE `describe` per scenario of `<module>.feature`, ONE `it` per step that
 * makes a request, each named from the feature by `recordedStepDir`, which
 * THROWS when the feature holds no such scenario or step. `prepareScenarioDirs`
 * lays out one folder per step (a `.gitkeep` where a step makes no request)
 * before the scenario's first step records.
 *
 * Each scenario ARRANGES the staging data its steps need (uncaptured `call`s)
 * and RESTORES staging after it, so a re-record starts from the account as it
 * was found. Only values the run creates (`@example.com` addresses and the
 * like) are named by a scenario: they are not masked, so the scenario and its
 * recording carry the same words.
 *
 * @reference `packages/headless/src/modules/client-email/__tests__/client-email.fixtures.ts`
 * — "Client-Email scenario recordings", the canary, read while authoring,
 * never a match target.
 */

import { readFileSync } from "node:fs";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
import { includes, kebabCase, map, reject } from "lodash-es";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "module.feature"),
  "utf-8"
);

/** The Background step every scenario opens with — it reads the collection. */
const OPEN = "the modules playground is generated for the active client";

describe("Module scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let originalIds: string[] = [];
  const prepared = new Set<string>();

  const modules = () => `/api/clients/${clientId}/modules`;

  /** Records the requests one step makes into that step's own folder. */
  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, feature, scenario);
      prepared.add(scenario);
    }

    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        feature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: kebabCase(scenario)
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  const readList = (generator: Generator) => generator.get(modules());

  /** Staging back as it was found: only the records that were there before. */
  async function restoreStaging(): Promise<void> {
    const { body } = await call("GET", modules(), clientToken.access_token);
    const added = reject(
      (body as { data: { id: string }[] }).data,
      ({ id }) => includes(originalIds, id)
    );
    for (const { id } of added) {
      await call("DELETE", `${modules()}/${id}`, clientToken.access_token);
    }
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";

    const { body } = await call("GET", modules(), clientToken.access_token);
    originalIds = map((body as { data: { id: string }[] }).data, "id");
  }, 30000);

  afterAll(restoreStaging);

  describe("A client sees their own module collection", () => {
    const scenario = "A client sees their own module collection";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
  });

  describe("A client refreshes their module collection", () => {
    const scenario = "A client refreshes their module collection";

    it(OPEN, () => recordStep(scenario, OPEN, readList));
    it("the client refreshes the collection", () =>
      recordStep(scenario, "the client refreshes the collection", readList));
  });

  // A WRITING scenario records the write AND the read the module makes after
  // it, in the same step, so the replay answers the re-read with the rows
  // staging returned after the write:
  //
  //   describe("A client adds a module", () => {
  //     const scenario = "A client adds a module";
  //     const step = 'the client adds the module "module-added@example.com"';
  //
  //     afterAll(restoreStaging);
  //
  //     it(OPEN, () => recordStep(scenario, OPEN, readList));
  //     it(step, () =>
  //       recordStep(scenario, step, async generator => {
  //         await generator.post(modules(), { name: "module-added@example.com" });
  //         await readList(generator);
  //       }));
  //   });
});
