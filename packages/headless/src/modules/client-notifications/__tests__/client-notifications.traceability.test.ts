// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications traceability — every SCENARIO has an
 * identifiable proving test
 *
 * ## Job To Be Done
 * Prove per-SCENARIO coverage, not per-AC-tag coverage. The prior version
 * dedupped every scenario's `@AC-n` tag into a thirteen-key `Set`, so ANY one
 * test mentioning `AC-4` in its title certified every `AC-4` scenario —
 * thirty-seven scenarios collapsed onto thirteen keys, and renaming a
 * `describe` block satisfied the check with no assertion ever inspected (the
 * hollow-test finding this rewrite closes).
 *
 * Each of the feature's 40 scenario TITLES is already a distinct string (no
 * two scenarios share a title), so no new tag scheme was needed — `PROVING_MAP`
 * below keys on the verbatim `Scenario:` text and names, per scenario, the
 * spec file(s) and the EXACT `it(...)`/`describe(...)` title substring that
 * must appear in that file's real source for the scenario to count as proven.
 * A `describe`/`it` rename now BREAKS the match (forcing a conscious update
 * here), and a new scenario with no map entry fails immediately — the
 * opposite of "renaming satisfies it".
 *
 * This run is unit + integration ONLY (review-notes.md binding ruling) — no
 * e2e proof is declared or expected here.
 *
 * ## What Breaks If These Fail
 * A capability silently loses its proof — shape present, behaviour unproven —
 * or drifts unnoticed when a test is renamed/removed without updating what it
 * was supposed to be proving.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const COLOCATED_FEATURE = join(TEST_DIR, "client-notifications.feature");

type FeatureScenario = { title: string; todo: boolean };

/**
 * Every `Scenario:` in the co-located feature, in file order, with its
 * `@todo` status resolved from the contiguous run of `@`-tag lines
 * immediately above it (never a blank-line-separated tag group — Gherkin
 * tags sit directly above the line they tag).
 */
function featureScenarios(path: string): FeatureScenario[] {
  const lines = readFileSync(path, "utf-8").split("\n");
  const scenarios: FeatureScenario[] = [];

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/^\s*Scenario:\s*(.+?)\s*$/);
    if (!match) continue;

    let cursor = index - 1;
    let isTodo = false;
    while (cursor >= 0 && /^\s*@/.test(lines[cursor])) {
      if (/@todo/.test(lines[cursor])) isTodo = true;
      cursor--;
    }
    scenarios.push({ title: match[1], todo: isTodo });
  }

  return scenarios;
}

/** One proving-test reference: a file plus an exact title substring it must contain. */
type ProvingRef = { file: string; contains: string };

/**
 * ONE entry per non-`@todo` feature scenario (verified below against the
 * feature's own scenario count — this map can drift only if BOTH the
 * feature and this file are edited, never silently). Every `contains` string
 * is copied VERBATIM from the real `it(...)`/`describe(...)` call in the
 * named file — a future rename breaks the match, not silently passes it.
 *
 * A scenario that folds several DOORS into one capability carries one ref per
 * door, and a single test may be cited by two scenarios (the locked-topic
 * refusal and the pre-lock opt-out's survival are both read off the one
 * compound bulk-through-input test) — the value is a list, so that is exact
 * rather than a duplicate claim.
 */
const PROVING_MAP: Record<string, ProvingRef[]> = {
  "See every topic, every channel, and the state of each pair": [
    {
      file: "client-notifications.collection.int.test.ts",
      contains:
        "reads every topic, every channel, and the correct on/off state of a real opted-out pair"
    },
    {
      file: "client-notifications.collection.int.test.ts",
      contains: "reads a pair absent from the recorded opt-out set as ON"
    }
  ],
  "See the whole grid, never a first page of it": [
    {
      file: "client-notifications.collection.int.test.ts",
      contains: "sends limit=0 on all three requests"
    },
    {
      file: "client-notifications.collection.int.test.ts",
      contains:
        "an opt-out set larger than one server page arrives whole — the module's own read never truncates it"
    }
  ],
  "See my preferences load, or be told they failed, never a wait that never ends":
    [
      {
        file: "client-notifications.collection.int.test.ts",
        contains: "isReady() resolves true once the three reads have settled"
      },
      {
        file: "client-notifications.collection.int.test.ts",
        contains:
          "isReady() resolves false, within a bounded timeout, when the opt-outs read settles with an error (drift D23 — isFetched is true on error too)"
      },
      {
        file: "client-notifications.collection.int.test.ts",
        contains: "reports loading/error/ready meta"
      },
      {
        file: "client-notifications.collection.int.test.ts",
        contains:
          "hasError flips true when the opt-outs read fails (AC-1's failing limb) — never asserted true anywhere else on the collection"
      }
    ],
  "Turn one channel off for one topic and save it": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "writes the WHOLE opt-out set — every prior opt-out plus the new one, never a diff"
    },
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "reads isEnabled(T, C) as false immediately after the save settles"
    },
    {
      file: "client-notifications.manager.int.test.ts",
      contains: "the collection's grid reflects the change without reopening it"
    }
  ],
  "Turn every channel on, or every channel off, for one topic at once": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "selectAll(T) turns every channel on and clears T's opt-out rows from the draft"
    },
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "clearAll(T) turns every channel off and the model carries exactly n rows for T"
    }
  ],
  "Turn a whole topic off the instant my preferences open": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "acts over the FULL channel list the moment the editor opens — before any manual await beyond isReady()"
    }
  ],
  "Abandon my unsaved changes": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "is not dirty on open, becomes dirty after a toggle, and clears on revert"
    }
  ],
  "Be told whether I have unsaved changes, and be refused a pointless save": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains: "refuses a save when nothing is dirty — no outbound request"
    }
  ],
  "See that my save is running until it finishes": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "isProcessing flips false -> true -> false around the save, and onDone() resolves only once it settles"
    }
  ],
  "Be refused every way I try to opt out of an essential topic": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "toggle() on a locked topic leaves the pair ON and raises no dirty flag"
    },
    {
      file: "client-notifications.manager.int.test.ts",
      contains: "clearAll() on a locked topic changes nothing"
    },
    {
      file: "client-notifications.manager.update-guard.int.test.ts",
      contains:
        "a NEW locked-topic row passed to update() never reaches the server, but the rest of the same save does"
    },
    {
      file: "client-notifications.manager.input.int.test.ts",
      contains:
        "input() refuses to newly opt a locked topic out — the draft holds, and a save afterward carries no row for it"
    },
    {
      file: "client-notifications.manager.bulk-input-debounce.int.test.ts",
      contains:
        "a bulk clear on a locked topic through input() is refused, and a pre-existing locked opt-out survives an unrelated legitimate bulk clear elsewhere"
    }
  ],
  "See which of my topics are locked": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains: "publishes isTopicLocked so a caller can also disable in the UI"
    }
  ],
  "Be told when my save fails, and keep the work": [
    {
      file: "client-notifications.manager.int.test.ts",
      contains:
        "puts the rejection on error, keeps isDirty true, and keeps the toggled value"
    }
  ],
  "The channels I turn off are exactly the ones that stop reaching me": [
    {
      file: "client-notifications.manager.opt-outs-projection.int.test.ts",
      contains:
        "re-enabling a previously opted-out pair emits no row for it in the PUT body"
    },
    {
      file: "client-notifications.manager.opt-outs-projection.int.test.ts",
      contains:
        "produces exactly one row, with the right topic_id and channel_id (billing x template_websocket — non-colliding ids)"
    },
    {
      file: "client-notifications.manager.opt-outs-projection.int.test.ts",
      contains:
        "both recorded opt-out rows read false in preferences, and every other topic x channel pair reads true"
    },
    {
      file: "client-notifications.manager.opt-outs-projection.int.test.ts",
      contains:
        "read -> toggle one pair -> save -> the PUT body differs from the recorded set by exactly that one row"
    }
  ],
  "Manage my preferences from an emailed link without signing in": [
    {
      file: "client-notifications.token.int.test.ts",
      contains:
        "the opt-outs GET carries ?token=<t> and NO Authorization header"
    },
    {
      file: "client-notifications.token.int.test.ts",
      contains:
        "the opt-outs PUT (save) carries ?token=<t> and NO Authorization header"
    }
  ],
  "See the topics and channels on offer when following an emailed link": [
    {
      file: "client-notifications.token.int.test.ts",
      contains:
        "topics and channels carry Authorization: Bearer <session access_token>, and no token= param"
    }
  ],
  "No one can point this at another person's preferences": [
    {
      file: "client-notifications.surface.test.ts",
      contains: "rejects `.for('client', id)` on the COLLECTION at compile time"
    },
    {
      file: "client-notifications.surface.test.ts",
      contains: "rejects `.for('client', id)` on the MANAGER at compile time"
    }
  ],
  "Always see my whole grid, and only the channels that can reach me": [
    {
      file: "client-notifications.collection.int.test.ts",
      contains:
        "the channels request carries the server-fixed recipient-type filter"
    },
    {
      file: "client-notifications.collection.int.test.ts",
      contains:
        "no reachable member anywhere on useInternals() is a criteria write verb — not only the one named spelling"
    }
  ],
  "Find no filter or sort on my grid, because all of it is always shown": [
    {
      file: "client-notifications.surface.test.ts",
      contains:
        "declares only a pagination branch — no filters branch and no sort member exist as siblings on the barrel's published shape"
    },
    {
      file: "client-notifications.surface.test.ts",
      contains:
        "the published `pagination` is the query's read-only PaginationInfo echo, not a settable request-state channel"
    }
  ],
  "My saved preferences survive the save settling": [
    {
      file: "client-notifications.manager.post-save.int.test.ts",
      contains:
        "still holds the saved set once the save settles — it does not empty"
    },
    {
      file: "client-notifications.manager.post-save.int.test.ts",
      contains:
        "the pair just turned off still reads disabled once the save settles"
    },
    {
      file: "client-notifications.manager.post-save.int.test.ts",
      contains: "isDirty clears once a successful save settles"
    },
    {
      file: "client-notifications.manager.shrink-post-save.int.test.ts",
      contains:
        "the draft holds the shrunk (emptied-for-that-topic) set once the save settles — it does not re-grow"
    },
    {
      file: "client-notifications.manager.shrink-post-save.int.test.ts",
      contains: "the topic reads all channels on once the save settles"
    },
    {
      file: "client-notifications.manager.shrink-post-save.int.test.ts",
      contains:
        "the enabled pair still reads enabled once the save settles, and the topic's other opted-out pair is untouched"
    }
  ],
  "A second save always carries my whole current set, never an empty one": [
    {
      file: "client-notifications.manager.post-save.int.test.ts",
      contains:
        "a second, independent save after the first settles sends the CURRENT FULL set — never empty, never a diff"
    },
    {
      file: "client-notifications.manager.shrink-post-save.int.test.ts",
      contains:
        "sends the current (shrunk) set first, then does not resurrect the cleared topic on the next save"
    }
  ],
  "Reverting after a save restores what I saved, not what I had before": [
    {
      file: "client-notifications.manager.post-save.int.test.ts",
      contains:
        "revert() after a settled save restores the SAVED state, not the pre-save state"
    },
    {
      file: "client-notifications.manager.shrink-post-save.int.test.ts",
      contains:
        "restores the shrunk state, not the pre-save fully-opted-out state"
    }
  ],
  "After a save, reverting changes nothing, because my grid already matches what was saved":
    [
      {
        file: "client-notifications.manager.dirty-parity.int.test.ts",
        contains:
          "after a save that GROWS the opt-out set settles, the draft's content equals the server's"
      },
      {
        file: "client-notifications.manager.dirty-parity.int.test.ts",
        contains:
          "after a save that SHRINKS the opt-out set settles, the draft's content equals the server's"
      }
    ],
  "Saved preferences from an emailed link survive the save settling": [
    {
      file: "client-notifications.token.post-save.int.test.ts",
      contains:
        "the toggled pair still reads as saved, and isDirty clears, once the save settles"
    }
  ],
  "A second save from an emailed link never wipes what was already saved": [
    {
      file: "client-notifications.token.post-save.int.test.ts",
      contains:
        "carries the current full set, and stays identified by the link token with NO Authorization header"
    }
  ],
  "An opt-out I made before a topic became essential is never quietly dropped":
    [
      {
        file: "client-notifications.manager.update-guard.int.test.ts",
        contains:
          "a locked topic's row the server already held before it became locked is carried forward, unfiltered, inside a save that also adds a legitimate row"
      },
      {
        file: "client-notifications.manager.input.int.test.ts",
        contains:
          "a pre-existing locked-topic opt-out survives an unrelated input(), through to the wire"
      },
      {
        file: "client-notifications.manager.bulk.int.test.ts",
        contains:
          "clearAll() on a locked topic changes nothing, and a pre-existing opt-out on that locked topic survives a legitimate clearAll() elsewhere, through to the wire"
      },
      {
        file: "client-notifications.manager.bulk-input-debounce.int.test.ts",
        contains:
          "a bulk clear on a locked topic through input() is refused, and a pre-existing locked opt-out survives an unrelated legitimate bulk clear elsewhere"
      }
    ],
  "A rejected save can be retried with the same change": [
    {
      file: "client-notifications.manager.retry-after-reject.int.test.ts",
      contains:
        "retrying update() after a rejected save issues a SECOND PUT carrying the same value"
    }
  ],
  "Open my preferences before I am signed in, and edit them once I am": [
    {
      file: "client-notifications.manager.late-session-refresh.int.test.ts",
      contains:
        "a client-actor scope with no clientId and no token reaches available once the session resolves with a real identity"
    }
  ],
  "Keep my unsaved changes when a sign-in happens elsewhere while my link editor is open":
    [
      {
        file: "client-notifications.manager.late-session-refresh-token-scope.int.test.ts",
        contains:
          "a token-bearing scope already available and dirty survives a client identity resolving on the ambient session afterwards"
      },
      {
        file: "client-notifications.manager.late-session-dirty-content.int.test.ts",
        contains:
          "a token-bearing scope's dirty draft content, not only its isDirty flag, survives the session resolving late"
      }
    ],
  "My emailed link is never exposed anywhere else on the page": [
    {
      file: "client-notifications.token-containment.int.test.ts",
      contains:
        "the manager's public context (useContext() + useMeta()) carries no occurrence of the token"
    },
    {
      file: "client-notifications.token-containment.int.test.ts",
      contains:
        "useInternals()'s raw state carries no token — state.value.context carries no `token` key or value"
    },
    {
      file: "client-notifications.token-containment.int.test.ts",
      contains:
        "no queryKey a consumer can read carries the token — the collection's internals publish only the stable prefix"
    },
    {
      file: "client-notifications.token-containment.int.test.ts",
      contains: "a client with a token still reads and saves"
    }
  ],
  "Change several channels quickly, and save exactly what I ended up setting": [
    {
      file: "client-notifications.manager.input.int.test.ts",
      contains:
        "a single change through input() reaches the draft and marks the editor dirty"
    },
    {
      file: "client-notifications.manager.input.int.test.ts",
      contains:
        "several rapid input() calls collapse to the LAST call's value, never an earlier one"
    },
    {
      file: "client-notifications.manager.input.int.test.ts",
      contains:
        "a save immediately after input() sends what was actually typed, never a stale pre-debounce value"
    }
  ],
  "The all-channels tick for a topic tells the truth after I change one channel":
    [
      {
        file: "client-notifications.manager.bulk.int.test.ts",
        contains:
          "the bulk affordance's own state flips off the moment a single channel is turned off, and back on once every channel is again enabled"
      }
    ],
  "Turning off every channel for a topic stops exactly that topic's real channels, and nothing else":
    [
      {
        file: "client-notifications.manager.bulk.int.test.ts",
        contains:
          "after a bulk clear and a save, the PUT body carries one row per real channel and never a row for the bulk affordance's own sentinel key"
      },
      {
        file: "client-notifications.manager.bulk-input-debounce.int.test.ts",
        contains:
          "after a bulk clear through input() and a save, the draft and the PUT body carry one entry per real channel and never the bulk affordance's own sentinel key"
      }
    ],
  "A channel I turn back on after clearing a topic stays on, however quickly I do it":
    [
      {
        file: "client-notifications.manager.bulk-input-debounce.int.test.ts",
        contains:
          "clearing every channel of a topic then turning one back on, both inside the debounce window, keeps that one channel on and every other channel off"
      },
      {
        file: "client-notifications.manager.bulk-input-debounce.int.test.ts",
        contains:
          "clearing every channel of a topic, letting it settle, then turning one channel back on keeps that one channel on and every other channel off"
      }
    ],
  "Turn on every channel for a topic, and one I had turned off comes back on": [
    {
      file: "client-notifications.manager.bulk-input-debounce.int.test.ts",
      contains:
        "a bulk select-all reaches a channel the server already carried as opted out"
    }
  ],
  "Turn off one channel, and no other channel moves": [
    {
      file: "client-notifications.manager.bulk-input-debounce.int.test.ts",
      contains:
        "turning off one channel through input() moves only that channel — no other channel of any topic changes state"
    }
  ],
  "Turn on every channel for a topic but keep one off, and that one stays off":
    [
      {
        file: "client-notifications.manager.bulk-input-debounce.int.test.ts",
        contains:
          "a per-channel exception explicitly stated in the SAME input() call as a bulk instruction survives it, and every other channel follows the bulk"
      }
    ],
  "A channel I tick stays ticked, and Save is offered": [
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains:
        "the model carries the flipped pair BEFORE the debounce window elapses, so a controlled form never re-renders the old value"
    },
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains:
        "that same click leaves the draft dirty, so the save is offered rather than refused"
    }
  ],
  "A tick I make is never undone by the form redrawing itself": [
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains:
        "a per-channel tick survives the form re-emitting the pre-click draft"
    },
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains: "an All-channels tick survives the same echo"
    }
  ],
  "The all-channels tick stays where I put it": [
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains:
        "ticking All-channels leaves the sentinel ticked and every channel on, once the parse settles"
    },
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains: "survives emit 2 restating the sentinel from unchanged channels"
    },
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains:
        "survives the renderer's measured second emit: sentinel already settled, channels unmoved"
    }
  ],
  "Revert restores what I saved, even if the form clears itself first": [
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains:
        "an empty preferences payload is dropped, not sent, so the draft the user is reverting still exists"
    },
    {
      file: "client-notifications.manager.input-leading-edge.int.test.ts",
      contains:
        "revert() then restores the saved baseline, leaving the draft clean"
    }
  ]
};

// -----------------------------------------------------------------------------

describe("client-notifications traceability — co-located feature vs proving tests", () => {
  it("the co-located feature is present and carries at least one scenario", () => {
    expect(existsSync(COLOCATED_FEATURE)).toBe(true);
    expect(featureScenarios(COLOCATED_FEATURE).length).toBeGreaterThan(0);
  });

  it("every scenario in the feature has a map entry, and every map entry matches a real (non-@todo) scenario — no drift either way", () => {
    const scenarios = featureScenarios(COLOCATED_FEATURE).filter(s => !s.todo);
    const scenarioTitles = new Set(scenarios.map(s => s.title));
    const mapTitles = Object.keys(PROVING_MAP);

    const scenariosMissingFromMap = [...scenarioTitles].filter(
      title => !mapTitles.includes(title)
    );
    const orphanedMapEntries = mapTitles.filter(
      title => !scenarioTitles.has(title)
    );

    expect(
      { scenariosMissingFromMap, orphanedMapEntries },
      "the feature and PROVING_MAP have drifted apart — a scenario was added/removed/renamed without updating the other"
    ).toEqual({ scenariosMissingFromMap: [], orphanedMapEntries: [] });
  });

  it("every non-@todo scenario's mapped proving test(s) are found VERBATIM in the named spec file's real source", () => {
    const scenarios = featureScenarios(COLOCATED_FEATURE).filter(s => !s.todo);
    const fileCache = new Map<string, string>();
    const readFile = (file: string): string => {
      const cached = fileCache.get(file);
      if (cached !== undefined) return cached;
      const content = readFileSync(join(TEST_DIR, file), "utf-8");
      fileCache.set(file, content);
      return content;
    };

    const missing: string[] = [];
    for (const scenario of scenarios) {
      const refs = PROVING_MAP[scenario.title];
      if (!refs || refs.length === 0) {
        missing.push(`${scenario.title} — no map entry`);
        continue;
      }
      for (const ref of refs) {
        const content = readFile(ref.file);
        if (!content.includes(ref.contains)) {
          missing.push(
            `${scenario.title} -> ${ref.file}: proving title not found verbatim: "${ref.contains}"`
          );
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
