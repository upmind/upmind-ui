// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the editor a collection hands off to boots FRESH for a new
 * record and `.for()` an existing one (C2).
 *
 * ## Job To Be Done
 * The scope registry caches a cell per key, which is exactly right for a record
 * that HAS a key and exactly wrong for one that does not: two drafts (or a draft
 * after a save) would share one interpreter, so the second Add would open
 * carrying the first one's address. `.fresh()` mints a unique key per call;
 * `.for(contextType, id)` selects the record the row named. What is measured
 * here is which builder step the editor actually takes — the real
 * `useClientEmailManager` builder, wrapped to observe, never replaced.
 *
 * The same seam owns the editor's dismissal: `onUnmounted` destroys the cell it
 * booted, and a user who closes the dialog — or clicks the next row's Edit —
 * does that while the record is still loading.
 *
 * ## What Breaks If These Fail
 * Add re-opens the previous draft (or the record just saved), and two open
 * editors write through one machine — the defect the fresh-boot mutant restores.
 * Or the dismissal leaks a rejection nobody catches, so an ordinary Escape
 * reports an error the user never caused.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../tests/support/recorded-emails";
import clientEmail from "../../../useClientEmail/scenario";
import ManageDialog from "../ManageDialog.vue";
import { EMAIL_EDITOR } from "./resolved-handoffs";
import { map } from "lodash-es";
import type {
  FourLayerComposable,
  ResolvedHandoff,
  ScenarioScopedCell
} from "../../scenario.types";

// -----------------------------------------------------------------------------

type Step = { step: string; cell: ScenarioScopedCell };

/**
 * The canary's REAL editor declaration with its builder wrapped: every step the
 * consumer takes is recorded and then delegated, so the composable under the
 * declaration is the shipped one.
 */
function observedEditor() {
  const steps: Step[] = [];

  const useList = ((...args: never[]) => {
    const built = (clientEmail.useList as FourLayerComposable)(...args);

    return {
      as(actor: ScopeActorTypes) {
        const cell = built.as(actor);

        return {
          ...cell,
          fresh: () => {
            const fresh = cell.fresh?.() as ScenarioScopedCell;
            steps.push({ step: "fresh", cell: fresh });
            return fresh;
          },
          for: (type: string, id: string) => {
            const scoped = cell.for?.(type, id) as ScenarioScopedCell;
            steps.push({ step: `for:${type}:${id}`, cell: scoped });
            return scoped;
          }
        };
      }
    };
  }) as FourLayerComposable;

  const scenario = { ...EMAIL_EDITOR, useList };

  return {
    steps,
    taken: () => map(steps, "step"),
    handoff: (contextFrom?: string): ResolvedHandoff => ({
      scenario,
      actor: ScopeActorTypes.CLIENT,
      contextFrom
    })
  };
}

const mountEditor = (handoff: ResolvedHandoff, contextId?: string) =>
  mount(ManageDialog, {
    attachTo: document.body,
    props: { handoff, contextId }
  });

/**
 * Everything the runtime reported unhandled while `run` executed and its
 * microtasks drained — the browser's console error, read where a spec can see
 * it. The timer is what lets a rejection with no local `catch` reach the
 * runtime at all; awaiting a promise would only observe the ones already
 * handled.
 */
async function unhandledDuring(run: () => void) {
  const reported: unknown[] = [];
  const capture = (reason: unknown) => reported.push(reason);

  process.on("unhandledRejection", capture);
  run();
  await new Promise(resolve => setTimeout(resolve, 50));
  process.off("unhandledRejection", capture);

  return map(reported, String);
}

// -----------------------------------------------------------------------------

describe("@AC3 the editor boots FRESH on a record that does not exist yet", () => {
  it("takes the builder's fresh() step, never the cached cell", () => {
    const observed = observedEditor();

    mountEditor(observed.handoff());

    expect(observed.taken()).toEqual(["fresh"]);
  });

  it("hands two opens two DISTINCT instances, so one draft never carries another's record", () => {
    const observed = observedEditor();

    mountEditor(observed.handoff());
    mountEditor(observed.handoff());

    expect(observed.taken()).toEqual(["fresh", "fresh"]);
    expect(observed.steps[0]?.cell).not.toBe(observed.steps[1]?.cell);
    expect(observed.steps[0]?.cell.useInternals?.().service).not.toBe(
      observed.steps[1]?.cell.useInternals?.().service
    );
  });

  it("opens on no record — the model is empty because the scope names no id", () => {
    const observed = observedEditor();

    mountEditor(observed.handoff());

    const cell = observed.steps[0]?.cell as ScenarioScopedCell;
    expect(cell.useContext().id.value).toBeUndefined();
    expect(cell.useMeta().isNew.value).toBe(true);
  });
});

describe("@AC3 the editor boots .for() the record the row named", () => {
  it("takes the for() step with the declared context type and the row's id", () => {
    const observed = observedEditor();

    mountEditor(observed.handoff("/id"), unverifiedRow.id);

    expect(observed.taken()).toEqual([
      `for:${clientEmail.scope.contextType}:${unverifiedRow.id}`
    ]);
  });

  it("opens on that record, so its save updates rather than creates", () => {
    const observed = observedEditor();

    mountEditor(observed.handoff("/id"), unverifiedRow.id);

    const cell = observed.steps[0]?.cell as ScenarioScopedCell;
    expect(cell.useContext().id.value).toBe(unverifiedRow.id);
    expect(cell.useMeta().isNew.value).toBe(false);
  });

  it("never takes fresh() for a record that already exists", () => {
    const observed = observedEditor();

    mountEditor(observed.handoff("/id"), unverifiedRow.id);

    expect(observed.taken()).not.toContain("fresh");
  });
});

describe("@AC3 the editor is dismissible while it is still booting", () => {
  it("survives an Escape taken before the record has loaded", async () => {
    const observed = observedEditor();

    const reported = await unhandledDuring(() =>
      mountEditor(observed.handoff("/id"), unverifiedRow.id).unmount()
    );

    expect(reported).toEqual([]);
  });

  it("survives the row-to-row re-key, which dismisses one editor mid-boot by construction", async () => {
    const observed = observedEditor();

    const reported = await unhandledDuring(() => {
      mountEditor(observed.handoff("/id"), unverifiedRow.id).unmount();
      mountEditor(observed.handoff("/id"), defaultRow.id);
    });

    expect(reported).toEqual([]);
  });
});
