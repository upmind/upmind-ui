// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications — the page actually mounts and draws
 * (AC-14, gap-closure)
 *
 * ## Job To Be Done
 * `client-notifications-declaration.spec.ts` proves the SCENARIO's declared
 * shape — it never mounts a component. Nothing else in the repo drives
 * `FormFlowSurface` through this module's REAL, derived `useSchema`/
 * `useUischema` and a REAL `toPreferencesModel` seed. This is the read-back
 * `design.md` §D13/AC-14 stand on: that the grid the harness draws is the one
 * the module's own live schema factory produces, not a shape asserted in the
 * abstract.
 *
 * `useSchema`/`useUischema`/`toPreferencesModel` are `@internal` — reached
 * here through `internalKits["client-notifications"]`
 * (`@upmind-automation/headless/testing`), the one lawful cross-package door
 * (`client-notifications.internal-kit.ts`) — never a relative import through
 * the package boundary.
 *
 * Reads a raw `[role="checkbox"]` DOM query rather than
 * `findAllComponents(Checkbox)` — the latter is flaky against this tree
 * (observed dropping from 6 matches to 1 depending on timing unrelated to
 * this module, inside reka's own Checkbox/Presence teardown), where the DOM
 * query is stable. Every async prerequisite (`internalKits`'s dynamic
 * import) is resolved BEFORE `mount()`.
 *
 * ## What Breaks If These Fail
 * The scenario's declared shape stays green while the actual page renders an
 * empty form no one can act on — the exact failure this gap-closure pass
 * exists to close (`parity.yaml` row `editor-form-field-set`,
 * `jtbd_failure_condition_check`).
 */

import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UpmForm } from "@upmind-automation/client-vue";
import { internalKits } from "@upmind-automation/headless/testing";
import { FormFlowSurface } from "../runtime/components/surfaces";

// -----------------------------------------------------------------------------

type Topic = {
  id: string;
  name: string;
  description: string;
  code: string;
  canOptOut: boolean;
  meta: { isMandatory: boolean };
};
type Channel = { id: string; name: string; code: string };
type OptOut = { topicId: string; channelId: string };
type Lookups = { topics: Topic[]; channels: Channel[] };
type PreferencesModel = { preferences: Record<string, boolean> };

type NotificationsInternalKit = {
  useSchema: (lookups: Lookups) => unknown;
  useUischema: (lookups: Lookups) => unknown;
  toPreferencesModel: (
    topics: Topic[],
    channels: Channel[],
    optOuts: OptOut[]
  ) => PreferencesModel;
};

const preferenceKey = (topicId: string, channelId: string): string =>
  `${topicId}::${channelId}`;

/** Key-order-independent equality over a flat boolean-record draft. */
function sameDraft(a: PreferencesModel, b: PreferencesModel): boolean {
  const keys = new Set([
    ...Object.keys(a.preferences),
    ...Object.keys(b.preferences)
  ]);
  for (const key of keys) {
    if (a.preferences[key] !== b.preferences[key]) return false;
  }
  return true;
}

const topicOpen: Topic = {
  id: "11111111-1111-4111-8111-111111111101",
  name: "Order Updates",
  description: "Order status changes",
  code: "orders",
  canOptOut: true,
  meta: { isMandatory: false }
};
const topicLocked: Topic = {
  id: "22222222-2222-4222-8222-222222222202",
  name: "Security Alerts",
  description: "Account security events",
  code: "security",
  canOptOut: false,
  meta: { isMandatory: true }
};
const channelEmail: Channel = {
  id: "33333333-3333-4333-8333-333333333303",
  name: "Email",
  code: "email"
};
const channelSms: Channel = {
  id: "44444444-4444-4444-8444-444444444404",
  name: "SMS",
  code: "sms"
};

const lookups: Lookups = {
  topics: [topicOpen, topicLocked],
  channels: [channelEmail, channelSms]
};

/** Seeded: the open topic's Email channel is opted out; nothing else is. */
const optOuts: OptOut[] = [
  { topicId: topicOpen.id, channelId: channelEmail.id }
];

async function loadKit(): Promise<NotificationsInternalKit> {
  const kit = await internalKits["client-notifications"]();
  return kit as unknown as NotificationsInternalKit;
}

/**
 * Every mount is unmounted in `afterEach`. `try`/`catch` guards a reka
 * Checkbox teardown quirk unrelated to this module — its `Presence`/portal
 * cleanup occasionally throws on an already-detached node — never something
 * an assertion above already passed on.
 */
let mounted: VueWrapper[] = [];

afterEach(() => {
  for (const wrapper of mounted) {
    try {
      wrapper.unmount();
    } catch {
      // See comment above — a known reka teardown quirk, not this module.
    }
  }
  mounted = [];
});

type Snapshot = {
  model: PreferencesModel;
  schema: unknown;
  uischema: unknown;
};

/** Resolves the async prerequisite ONLY — never mounts. Callers mount and
 * read the DOM in one synchronous continuation (see file header). */
async function prepareSnapshot(): Promise<Snapshot> {
  const kit = await loadKit();
  const model = kit.toPreferencesModel(
    lookups.topics,
    lookups.channels,
    optOuts
  );
  return {
    model,
    schema: kit.useSchema(lookups),
    uischema: kit.useUischema(lookups)
  };
}

function mountSurface(
  snapshot: Snapshot,
  actions: { input?: () => void; update?: () => void; revert?: () => void }
): VueWrapper {
  const wrapper = mount(FormFlowSurface, {
    props: {
      snapshot: {
        actions: Object.keys(actions),
        context: snapshot,
        meta: {}
      },
      actions
    }
  }) as VueWrapper;
  mounted.push(wrapper);
  return wrapper;
}

// -----------------------------------------------------------------------------

describe("AC-14 — the real derived schema/uischema draws a driveable grid", () => {
  it("draws one group per topic and one control per channel, plus one bulk control per topic", async () => {
    const snapshot = await prepareSnapshot();
    const wrapper = mountSurface(snapshot, {
      input: vi.fn(),
      update: vi.fn(),
      revert: vi.fn()
    });

    expect(wrapper.findAll("legend")).toHaveLength(lookups.topics.length);

    const checkboxes = wrapper.findAll('[role="checkbox"]');
    // Per topic: one stateful bulk control, whose own `checked` carries the
    // `isAllSelected` readout, plus one control per real channel.
    expect(checkboxes).toHaveLength(
      lookups.topics.length * (1 + lookups.channels.length)
    );
  });

  it("aria-checked reflects the seeded opt-out state per pair", async () => {
    const snapshot = await prepareSnapshot();
    const wrapper = mountSurface(snapshot, {
      input: vi.fn(),
      update: vi.fn(),
      revert: vi.fn()
    });
    const checkboxes = wrapper.findAll('[role="checkbox"]');

    // Declared order (`useUischema`): [bulk, ...channels] per topic, topics in
    // lookup order. The open topic is NOT fully selected (Email opted out), so
    // its visible bulk control is "select all" (unchecked).
    const [openBulk, openEmail, openSms, lockedBulk, lockedEmail, lockedSms] =
      checkboxes;

    expect(openBulk.attributes("aria-checked")).toBe("false");
    expect(openEmail.attributes("aria-checked")).toBe("false");
    expect(openSms.attributes("aria-checked")).toBe("true");

    // The locked topic carries no opt-outs, so it is fully selected — its
    // visible bulk control is "clear all" (checked), reflecting isAllSelected.
    expect(lockedBulk.attributes("aria-checked")).toBe("true");
    expect(lockedEmail.attributes("aria-checked")).toBe("true");
    expect(lockedSms.attributes("aria-checked")).toBe("true");
  });

  it("a locked topic's controls — bulk and per-channel alike — render disabled", async () => {
    const snapshot = await prepareSnapshot();
    const wrapper = mountSurface(snapshot, {
      input: vi.fn(),
      update: vi.fn(),
      revert: vi.fn()
    });
    const [openBulk, openEmail, openSms, lockedBulk, lockedEmail, lockedSms] =
      wrapper.findAll('[role="checkbox"]');

    expect(openBulk.attributes("disabled")).toBeUndefined();
    expect(openEmail.attributes("disabled")).toBeUndefined();
    expect(openSms.attributes("disabled")).toBeUndefined();

    expect(lockedBulk.attributes("disabled")).toBeDefined();
    expect(lockedEmail.attributes("disabled")).toBeDefined();
    expect(lockedSms.attributes("disabled")).toBeDefined();
  });

  it("clicking one control reaches the write door with the settled draft for exactly that pair, never another (AC-14)", async () => {
    const snapshot = await prepareSnapshot();
    const input = vi.fn();
    const wrapper = mountSurface(snapshot, {
      input,
      update: vi.fn(),
      revert: vi.fn()
    });
    const [, , openSms] = wrapper.findAll('[role="checkbox"]');

    await openSms.trigger("click");

    const targetKey = preferenceKey(topicOpen.id, channelSms.id);
    const expectedDraft: PreferencesModel = {
      preferences: { ...snapshot.model.preferences, [targetKey]: false }
    };

    expect(input.mock.calls.length).toBeGreaterThan(0);

    // The renderer may echo one real click into more than one call to this
    // write door (it does here — a shared-runtime quirk between
    // `FormHost.vue` and `@jsonforms/vue`, reproducible on an unrelated
    // control and outside this module's ownership; a raw call-count
    // assertion on it is not this module's to make). Across EVERY call —
    // settled or not — only the ONE pair the user actually touched may ever
    // differ from the seeded baseline: this is the outcome that must hold
    // regardless of how many times the door fires.
    for (const [payload] of input.mock.calls) {
      for (const [key, value] of Object.entries(snapshot.model.preferences)) {
        if (key !== targetKey) expect(payload.preferences[key]).toBe(value);
      }
    }

    // At least one call reaches the door carrying the fully SETTLED draft —
    // the flipped pair and nothing else — so the correct outcome is
    // genuinely reachable through this door, not merely a call that happened
    // to fire.
    const settledCall = input.mock.calls.find(([payload]) =>
      sameDraft(payload, expectedDraft)
    );
    expect(settledCall).toBeDefined();

    // isDirty, in the module's own terms (`design.md` §D13 — model vs
    // baseModel): the settled draft is genuinely NOT the seeded baseline.
    expect(sameDraft(settledCall![0], snapshot.model)).toBe(false);

    // The debounce collapse itself — that repeated calls to this door settle
    // onto exactly ONE distinct value reaching the machine — is a manager
    // capability proven at the integration layer
    // (`client-notifications.manager.input.int.test.ts`, "a burst of input()
    // calls collapses to the LAST one"), never re-proven here.
  });

  it("the submit control routes to the manager's update", async () => {
    const snapshot = await prepareSnapshot();
    const update = vi.fn();
    const wrapper = mountSurface(snapshot, {
      input: vi.fn(),
      update,
      revert: vi.fn()
    });
    const upmForm = wrapper.findComponent(UpmForm);

    await upmForm.vm.$emit("resolve", snapshot.model);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(snapshot.model);
  });

  it("the revert control draws when the manager publishes revert", async () => {
    const snapshot = await prepareSnapshot();
    const wrapper = mountSurface(snapshot, {
      input: vi.fn(),
      update: vi.fn(),
      revert: vi.fn()
    });
    const upmForm = wrapper.findComponent(UpmForm);

    expect(upmForm.props("actions")?.reset?.label).toBe("Revert changes");
  });

  it("no revert action means the reset control falls back to cancel", async () => {
    const snapshot = await prepareSnapshot();
    const wrapper = mountSurface(snapshot, {
      input: vi.fn(),
      update: vi.fn()
    });
    const upmForm = wrapper.findComponent(UpmForm);

    expect(upmForm.props("actions")?.reset?.label).toBe("Cancel");
  });
});
