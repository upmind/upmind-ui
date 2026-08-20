// -----------------------------------------------------------------------------
/**
 * @fileoverview The read overlay's fetch seam — the read twin of the editor's
 * `fresh()`/`for()` boot (`manage-dialog-fresh-boot`).
 *
 * ## Job To Be Done
 * A scenario that binds `useDetail` (client-email-history) opens a row on the
 * FRESHLY-FETCHED full record — the single-read composable booted `.withId()`
 * the row's own identity — so a field the list never carries (the email body)
 * is there to read. A scenario without it, or a row with no id to key by,
 * stays on the clicked row's own data and makes no second request. What is
 * measured here is which path the overlay takes: the REAL `useDetail` builder,
 * wrapped to observe, never replaced — the same seam
 * `manage-dialog-fresh-boot` observes for the editor.
 *
 * FE-3095: the target is the row's own record ID, handed to the builder's
 * `.withId(id)`. It is NOT a synthesised `{ type: 'email', id }` scope
 * context — a leaf record was never an ADR-001 context type — so the overlay
 * takes an `id` prop and no `context` prop, and the observer below records
 * `.withId` at BOTH builder positions rather than presuming which one the
 * overlay reaches for.
 *
 * ## What Breaks If These Fail
 * Either the overlay refetches a record the list already holds (a request per
 * row open, for a scenario that declared no read), or it never fetches the one
 * it must — so the body is permanently blank and the read overlay shows only
 * what the row already had.
 *
 * Negative control: `detail-dialog-fetch-boot.must-fail.patch`.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { UpmForm } from "@upmind-automation/client-vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { defaultRow } from "../../../testing/recorded-emails";
import { receivedEmailId } from "../../../testing/recorded-received-email";
import clientEmails from "../../../useClientEmails/client-email.scenario";
import clientEmailHistory from "../../../useClientReceivedEmails/client-email-history.scenario";
import { DetailSurfacePositionTypes } from "../../scenario.types";
import DetailDialog from "../DetailDialog.vue";
import { filter, forEach, map } from "lodash-es";
import type {
  DetailUischema,
  FourLayerComposable,
  ResolvedDetail,
  ScenarioScopedCell
} from "../../scenario.types";

// -----------------------------------------------------------------------------

// vaul-vue's drawer host probes `display-mode` on mount; jsdom ships no
// matchMedia, so the bare mount throws before any assertion runs.
window.matchMedia =
  window.matchMedia ||
  ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as unknown as MediaQueryList);

type Step = { step: string; cell: ScenarioScopedCell };

/**
 * The history page's REAL read composable with its builder wrapped: every step
 * the overlay takes is recorded and then delegated, so the composable under the
 * declaration is the shipped one. `.withId` is wrapped at the root AND after
 * `.as()`, so the recorded step is whichever position the overlay actually
 * reaches for.
 */
function observedDetail() {
  const steps: Step[] = [];

  const observe = (cell: ScenarioScopedCell): ScenarioScopedCell =>
    ({
      ...cell,
      withId: (id: string) => {
        const scoped = cell.withId?.(id) as ScenarioScopedCell;
        steps.push({ step: `withId:${id}`, cell: scoped });
        return scoped;
      }
    }) as ScenarioScopedCell;

  const useDetail = ((...args: never[]) => {
    const built = (clientEmailHistory.useDetail as FourLayerComposable)(
      ...args
    ) as ScenarioScopedCell & {
      as(actor: ScopeActorTypes): ScenarioScopedCell;
    };

    return observe({
      ...built,
      as: (actor: ScopeActorTypes) => observe(built.as(actor))
    } as unknown as ScenarioScopedCell);
  }) as FourLayerComposable;

  return {
    steps,
    taken: () => map(steps, "step"),
    resolved: (): ResolvedDetail => ({
      useDetail,
      actor: ScopeActorTypes.CLIENT,
      identifier: "id"
    })
  };
}

const HISTORY_DETAIL = clientEmailHistory.presentation.detail as DetailUischema;
const EMAIL_DETAIL = clientEmails.presentation.detail as DetailUischema;

const mountOverlay = (props: {
  record: Record<string, unknown>;
  detail?: ResolvedDetail;
  id?: string;
  presentation?: DetailUischema;
}) =>
  mount(DetailDialog, {
    attachTo: document.body,
    props: { actions: [], ...props }
  });

/** The overlay draws in a drawer teleported to `document.body`; let it open. */
async function openedText(props: Parameters<typeof mountOverlay>[0]) {
  const wrapper = mountOverlay(props);
  await flushPromises();
  await nextTick();
  const text = document.body.textContent ?? "";
  wrapper.unmount();
  return text;
}

// -----------------------------------------------------------------------------

describe("with useDetail bound, the overlay fetches the full record", () => {
  it("boots the read composable .withId() the row's own identity", () => {
    const observed = observedDetail();

    mountOverlay({
      record: { id: receivedEmailId },
      detail: observed.resolved(),
      id: receivedEmailId,
      presentation: HISTORY_DETAIL
    });

    expect(observed.taken()).toEqual([`withId:${receivedEmailId}`]);
  });

  it("keys the fetch by the row the user opened, never a fixed record", () => {
    const observed = observedDetail();

    mountOverlay({
      record: { id: "another-row-id" },
      detail: observed.resolved(),
      id: "another-row-id",
      presentation: HISTORY_DETAIL
    });

    expect(observed.taken()).toEqual(["withId:another-row-id"]);
  });

  it("synthesises no scope context for the record — the id is the whole target", () => {
    // FE-3095: `.for('email', id)` was the shape this replaces. The overlay may
    // reach for `.withId` and nothing else on the read's boot path.
    const observed = observedDetail();

    mountOverlay({
      record: { id: receivedEmailId },
      detail: observed.resolved(),
      id: receivedEmailId,
      presentation: HISTORY_DETAIL
    });

    expect(filter(observed.taken(), step => step.startsWith("for:"))).toEqual(
      []
    );
  });
});

describe("without a fetch, the overlay shows the clicked row's own data", () => {
  it("makes no request when the scenario binds no read composable", async () => {
    expect(
      await openedText({ record: defaultRow, presentation: EMAIL_DETAIL })
    ).toContain(defaultRow.email);
  });

  it("stays on the row-data path when the row carries no id to key by", () => {
    const observed = observedDetail();

    mountOverlay({
      record: defaultRow,
      detail: observed.resolved(),
      presentation: EMAIL_DETAIL
    });

    expect(observed.taken()).toEqual([]);
  });
});

describe("the overlay is read-only — editing is the editor's job", () => {
  it("mounts no editable form", async () => {
    const wrapper = mountOverlay({
      record: defaultRow,
      presentation: EMAIL_DETAIL
    });
    await flushPromises();
    await nextTick();

    expect(document.body.textContent).toContain(defaultRow.email);
    expect(wrapper.findComponent(UpmForm).exists()).toBe(false);
    wrapper.unmount();
  });

  it("exposes no save control", async () => {
    const wrapper = mountOverlay({
      record: defaultRow,
      presentation: EMAIL_DETAIL
    });
    await flushPromises();
    await nextTick();

    expect(document.body.querySelector('[data-test-value="save"]')).toBeNull();
    wrapper.unmount();
  });

  it("exposes a close control that dismisses it back to the list", async () => {
    const wrapper = mountOverlay({
      record: defaultRow,
      presentation: EMAIL_DETAIL
    });
    await flushPromises();
    await nextTick();

    const closes = filter(
      [...document.body.querySelectorAll("button")],
      button => /close/i.test(button.textContent ?? "")
    );

    expect(closes.length).toBeGreaterThan(0);
    wrapper.unmount();
  });
});

describe("position is presentation-only — it moves no data", () => {
  it("renders the same record whichever edge the drawer is asked to open from", async () => {
    const atRight = await openedText({
      record: defaultRow,
      presentation: EMAIL_DETAIL
    });
    const atBottom = await openedText({
      record: defaultRow,
      presentation: {
        ...EMAIL_DETAIL,
        position: DetailSurfacePositionTypes.BOTTOM
      }
    });

    // A side position is a Sheet and the bottom edge a Drawer, so each host
    // brings its own chrome; the record they carry is what may not vary.
    forEach([defaultRow.email, "Verified"], value => {
      expect(atRight).toContain(value);
      expect(atBottom).toContain(value);
    });
  });
});
