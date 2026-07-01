/**
 * @fileoverview Case Fixture Recorder (runner)
 *
 * ## Job To Be Done
 * Capture API request/response pairs as v3 `case` fixtures by hitting a real
 * target directly (no browser). Intended for ad-hoc case recording against
 * staging; it is deferred infrastructure — wire up the specific captures you
 * need below, then run against a real target.
 *
 * ## Usage
 *   TARGET_API=https://api.staging.upmind.io \
 *     node --experimental-strip-types tests/fixtures/record-cases.ts
 *
 * With no captures defined it prints guidance and exits cleanly (non-broken).
 */

import { ApiFixtureGenerator } from "./api-fixture-generator.ts";

// -----------------------------------------------------------------------------

const TARGET_API = process.env.TARGET_API || "https://api.staging.upmind.io";

async function main(): Promise<void> {
  const generator = new ApiFixtureGenerator(TARGET_API, { caseName: "query" });

  // --- Define the cases to capture here, e.g.:
  //   await generator.get("/api/countries");
  //   await generator.get("/api/self");
  const captures: Array<() => Promise<unknown>> = [];

  if (captures.length === 0) {
    console.log(
      `[record:cases] No captures defined. Target: ${TARGET_API}\n` +
        `Add generator.get/post(...) calls in tests/fixtures/record-cases.ts, ` +
        `then re-run against a real target.`
    );
    return;
  }

  for (const capture of captures) {
    await capture();
  }

  generator.save();
}

await main();
