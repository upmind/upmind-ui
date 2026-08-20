// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/scenario-tracks.spec
 * @description T4.4 — what a declaration says about its playlist, now that
 * `tracks` is the MODULE's own NAME and nothing else (`R6-37` · `R6-43`).
 * Four claims:
 *   1. the channel carries a name, never a playlist: one string, no feature
 *      text, no catalog and no pin list — pinning is dead, and width alone
 *      decides which chips fit (`R6-26`);
 *   2. a declaration imports no artefact at all — neither a headless test-kit
 *      specifier nor the corpus seam — because a name is not data;
 *   3. the machinery adds nothing: every registered scenario's `tracks` is the
 *      very value its own file exported, and the registry attaches only the
 *      directory it was found in;
 *   4. the playlist is RESOLVED from that name through the seam — a module the
 *      seam reaches yields a feature and a catalog, one it does not reach
 *      yields nothing, which leaves the page Live-only (`S12`).
 *
 * `useFeatureTracks`' own parsing is `feature-tracks.spec.ts`'s; what is read
 * here is the CHANNEL — who owns the playlist and what a page gets when nobody
 * names a module it can reach.
 *
 * Negative controls: `scenario-tracks.declaration-specifier.must-fail.patch`,
 * `scenario-tracks.runtime-owns-playlist.must-fail.patch`.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { useFeatureTracks } from "../runtime/composables/useFeatureTracks";
import { featureTracksFor } from "../runtime/force/corpus.source";
import { CLIENT_EMAIL_TRACK_COUNT } from "../runtime/force/corpus.source.types";
import { registry, scenarioKeys } from "../runtime/registry";
import clientEmails from "../useClientEmails/client-email.scenario";
import {
  every,
  filter,
  flatMap,
  get,
  isString,
  keyBy,
  keys,
  map,
  values
} from "lodash-es";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(__dirname, "..");

const DECLARATION_SUFFIX = ".scenario.ts";

/** Every scenario's own file — the declarations the registry globs. */
const declarationFiles = flatMap(
  filter(readdirSync(MODULE_DIR, { withFileTypes: true }), entry =>
    entry.isDirectory()
  ),
  entry =>
    map(
      filter(readdirSync(join(MODULE_DIR, entry.name)), file =>
        file.endsWith(DECLARATION_SUFFIX)
      ),
      file => join(MODULE_DIR, entry.name, file)
    )
);

/**
 * The declarations themselves, reached the way the app reaches them — off the
 * same glob `registry.ts` is built from, never hand-listed, so a scenario added
 * beside this runtime is covered here the moment it exists (`G3`).
 */
const declarations: Record<string, ScenarioDeclaration> = keyBy(
  map(
    values(
      import.meta.glob<{ default: ScenarioDeclaration }>("../*/*.scenario.ts", {
        eager: true
      })
    ),
    "default"
  ),
  "key"
);

const A_MODULE_THE_SEAM_DOES_NOT_REACH = "not-a-module-anyone-recorded";

// -----------------------------------------------------------------------------

describe("T4.4 the tracks channel is a module NAME (R6-37)", () => {
  it("carries one string — never a feature, a catalog or a pin list", () => {
    expect(isString(clientEmails.tracks)).toBe(true);
    expect(clientEmails.tracks).toBe("client-email");
    expect(get(clientEmails, ["tracks", "pinned"])).toBeUndefined();
    expect(get(clientEmails, ["tracks", "feature"])).toBeUndefined();
    expect(get(clientEmails, ["tracks", "catalog"])).toBeUndefined();
  });

  it("names a module whose artefacts the seam actually reaches", () => {
    expect(featureTracksFor(clientEmails.tracks as string)).toBeDefined();
  });
});

describe("T4.4 a declaration imports no artefact (ESC6 · R6-37)", () => {
  it("found a file for every registered scenario — an empty sweep proves nothing", () => {
    expect(declarationFiles).toHaveLength(scenarioKeys.length);
  });

  it("names no headless test-kit specifier in any declaration", () => {
    const offences = flatMap(declarationFiles, file =>
      map(
        [
          ...readFileSync(file, "utf-8").matchAll(
            /from\s+["']([^"']*headless\/testing[^"']*)["']/g
          )
        ],
        match => `${file}: ${match[1]}`
      )
    );

    expect(offences).toStrictEqual([]);
  });

  it("reaches for no corpus seam either — a name is not data", () => {
    const offences = filter(declarationFiles, file =>
      /from\s+["'][^"']*force\/corpus\.source["']/.test(
        readFileSync(file, "utf-8")
      )
    );

    expect(offences).toStrictEqual([]);
  });
});

describe("T4.4 the machinery is generic over every key (G3)", () => {
  it("hands each scenario the very tracks value its own file exported", () => {
    expect(
      filter(
        scenarioKeys,
        key =>
          get(registry, [key, "tracks"]) !== get(declarations, [key, "tracks"])
      )
    ).toStrictEqual([]);
  });

  it("attaches the directory and nothing else", () => {
    expect(
      flatMap(scenarioKeys, key => [
        ...keys(get(registry, [key])).filter(
          channel =>
            channel !== "route" && !(channel in get(declarations, [key], {}))
        )
      ])
    ).toStrictEqual([]);
    expect(
      every(scenarioKeys, key => isString(get(registry, [key, "route"])))
    ).toBe(true);
  });

  it("registers every declared scenario, so the claims above cover them all", () => {
    expect(scenarioKeys.length).toBeGreaterThan(0);
    expect(filter(scenarioKeys, key => !(key in declarations))).toStrictEqual(
      []
    );
  });

  it("carries no scenario's own playlist anywhere in the runtime", () => {
    const runtimeFiles = filter(
      readdirSync(join(MODULE_DIR, "runtime"), { recursive: true }) as string[],
      file =>
        isString(file) &&
        /\.(?:ts|vue)$/.test(file) &&
        !file.includes("__tests__")
    );

    const offences = filter(runtimeFiles, file =>
      /\bpinned\s*:|\btracks\s*\?\?/.test(
        readFileSync(join(MODULE_DIR, "runtime", file), "utf-8")
      )
    );

    expect(offences).toStrictEqual([]);
  });
});

describe("T4.4 naming a module the seam cannot reach leaves the page Live-only (S12)", () => {
  it("yields no track source at all for a module nobody recorded", () => {
    expect(featureTracksFor(A_MODULE_THE_SEAM_DOES_NOT_REACH)).toBeUndefined();
  });

  it("yields no track at all where there is no feature to play", () => {
    const { tracks } = useFeatureTracks({
      feature: "",
      catalog: featureTracksFor(clientEmails.tracks as string)!.catalog
    });

    expect(tracks).toStrictEqual([]);
  });

  it("carries the RESOLVED playlist all the way through", () => {
    const source = featureTracksFor(clientEmails.tracks as string)!;
    const { tracks } = useFeatureTracks(source);

    expect(source.feature.length).toBeGreaterThan(0);
    expect(tracks).toHaveLength(CLIENT_EMAIL_TRACK_COUNT);
  });
});
