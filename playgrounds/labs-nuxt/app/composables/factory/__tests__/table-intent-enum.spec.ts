// -----------------------------------------------------------------------------
/**
 * @fileoverview The table-intent discriminator is a MEMBER, not a raw string
 * (Task 56, W-20/W-D27) — and the deferral that made it a local one is on the
 * record rather than a silent pass.
 *
 * ## Job To Be Done
 * `TableIntent` is declared in `packages/scenario-harness` as a bare
 * string-literal union with nothing keying it, so every consumer comparison had
 * to spell `"filter"` / `"sort"` / `"paginate"` by hand. The harness is outside
 * this story's write set, so the members are mirrored at the consumer and the
 * enum lands at its real home with FE-3071 — an explicit deferral WITH a
 * receipt, which is what W-20's fallback demanded in place of the zero-hit grep
 * it could not reach.
 *
 * ## What Breaks If These Fail
 * A renamed union member compiles cleanly at every raw comparison and silently
 * stops routing intents — the exact failure the enum mandate exists to make
 * impossible.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TableIntentTypes } from "../useTableChannel";
import { filter, map, split, values } from "lodash-es";
import type { TableIntent } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const CHANNEL_SOURCE = join(import.meta.dirname, "..", "useTableChannel.ts");

const source = () => readFileSync(CHANNEL_SOURCE, "utf-8");

/** Lines comparing against a raw discriminator literal, comments excluded. */
const rawComparisons = () =>
  filter(split(source(), "\n"), line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return false;
    return /===\s*"(filter|sort|paginate)"/.test(line);
  });

// -----------------------------------------------------------------------------

describe("useTableChannel — the discriminator is a member (Task 56)", () => {
  it("compares against no raw intent-type string anywhere", () => {
    expect(rawComparisons()).toEqual([]);
  });

  it("the members ARE the union, so a renamed member cannot compile past this", () => {
    const members: TableIntent["type"][] = values(TableIntentTypes);

    expect(members.sort()).toEqual(["filter", "paginate", "sort"]);
  });

  it("carries the deferral receipt — the real home and the story that closes it", () => {
    const text = source();

    expect(text).toContain("table-channel.types.ts");
    expect(text).toContain("FE-3071");
  });

  it("the read-back can fail — it sees a raw comparison when one is written", () => {
    const withRaw = ['if (intent.type === "sort") return;', '// === "sort"'];

    expect(
      map(
        filter(withRaw, line => {
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("*")) return false;
          return /===\s*"(filter|sort|paginate)"/.test(line);
        }),
        line => line.trim()
      )
    ).toEqual(['if (intent.type === "sort") return;']);
  });
});
