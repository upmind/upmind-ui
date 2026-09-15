// -----------------------------------------------------------------------------
/**
 * @fileoverview auth overlay — the gate's header, session add-rows, and the swap
 * into the sign-in journey
 *
 * ## Job To Be Done
 * The auth gate opens as a dialog whose header carries ONLY the title, then four
 * add rows in one fixed order — guest, guest-customer, client, staff — each
 * keyed for a driver and labelled as an action. Choosing client or staff
 * REPLACES the list with the sign-in journey, targets it at that actor (staff
 * drives `user`, never `staff`) and offers it a Back; Back restores the list.
 *
 * ## What Breaks If These Fail
 * A row is dropped, reordered, or mislabelled; a stray control leaks into the
 * header beside the title; the gate fails to swap the list for the journey,
 * mis-targets the journey's actor so a driver clicks Staff and drives the wrong
 * one, or Back strands the operator in the form.
 *
 * ## Out of scope here — proven at the layer that can reach it
 * - The journey's own fields (username / password / Sign In / Register instead /
 *   Forgot your password) and the Back control's rendering: `AuthJourney` needs
 *   the real auth machine to render — a boundary-only double throws at
 *   `AuthJourney.vue:298` — so it is stubbed here and its form is proven at its
 *   own layer; standing up a machine double would be a shadow implementation.
 * - Layout (full-width, edge-matching, one-line left/right): jsdom computes none.
 * - The guest-customer brand-disabled reason: `auth-guest-customer.spec.ts` owns
 *   it; under a boundary auth double the gate's row is disabled regardless of
 *   brand config, so a page-level assertion here would prove nothing.
 * - The Guest route-out and the guest-customer registration chain: proven
 *   elsewhere, not faked here.
 */

import { Dialog, DialogContent } from "@upmind/ui";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent, h, ref } from "vue";
import {
  RouterLink,
  createRouter,
  createWebHistory,
  type Router
} from "vue-router";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  headlessDouble,
  labs,
  seedPool
} from "../../../components/scope/__tests__/harness";
import { filter, find, includes, map } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

vi.mock("@upmind-automation/headless", async () => {
  const real = await vi.importActual<Record<string, unknown>>(
    "@upmind-automation/headless"
  );
  const base = headlessDouble(real) as Record<string, unknown>;
  const cell = {
    useActions: () => ({
      registerAsGuest: vi.fn(() => Promise.resolve(true)),
      destroy: vi.fn(),
      reset: vi.fn(),
      set: vi.fn()
    }),
    useContext: () => ({ errors: ref([]) }),
    useMeta: () => ({
      isProcessing: computed(() => false),
      isLoading: computed(() => false)
    }),
    destroy: vi.fn()
  };
  const builder = {
    fresh: () => cell,
    for: () => cell,
    withId: () => cell,
    ...cell
  };
  return {
    ...base,
    useBrand: () => ({
      brandId: ref("brand-x"),
      name: ref("Brand X"),
      isReady: computed(() => true),
      getConfigValue: () => true
    }),
    useAuth: () => ({
      as: () => builder,
      inBrand: () => ({ as: () => builder })
    })
  };
});

const ADD_ROWS = [
  "actor-scope-add-guest",
  "actor-scope-add-guest-customer",
  "actor-scope-add-client",
  "actor-scope-add-staff"
];

// The journey renders its own form off the auth machine; the gate's contract is
// only the swap and the Back it delegates, so the journey is stood in for by a
// stub whose click re-emits the `cancel` the gate listens for.
const AuthJourneyStub = defineComponent({
  name: "AuthJourney",
  inheritAttrs: false,
  props: {
    actor: { type: String, default: "" },
    cancellable: { type: Boolean, default: false }
  },
  emits: ["cancel"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        {
          type: "button",
          "data-test-key": "journey-stub",
          "data-actor": props.actor,
          "data-cancellable": String(props.cancellable),
          onClick: () => emit("cancel")
        },
        "journey"
      );
  }
});

let wrapper: VueWrapper;
let router: Router;

const rowByKey = (key: string): HTMLElement | null =>
  document.body.querySelector(`[data-test-key="${key}"]`);

const rowLabel = (key: string): string =>
  (rowByKey(key)?.textContent ?? "").trim();

const journeyStub = (): HTMLElement | null =>
  document.body.querySelector('[data-test-key="journey-stub"]');

const clickRow = async (key: string): Promise<void> => {
  (rowByKey(key) as HTMLButtonElement | null)?.click();
  await flushPromises();
  await new Promise(resolve => setTimeout(resolve, 0));
};

async function mountGate(): Promise<void> {
  // One held guest, no client or staff: the state the contract's labels name
  // ("Add another guest session" vs "Log in as client / staff").
  seedPool([{ id: "guest-a", actor: AccessRoleTypes.GUEST }], {
    active: "guest-a"
  });

  router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div />" } },
      {
        path: "/overlays/auth/:scopeSuffix(.*)*",
        name: "overlays-auth",
        component: { template: "<div />" }
      }
    ]
  });
  await router.push("/overlays/auth");
  await router.isReady();

  const { default: AuthPage } = await import("../auth.vue");
  // The page is dialog CONTENT: its `DialogTitle` needs a `DialogRoot` ancestor,
  // and the overlay container owns the close button, so both are hosted here.
  const Host = defineComponent({
    setup() {
      return () =>
        h(Dialog, { defaultOpen: true }, () => [
          h(DialogContent, { closeLabel: "Close" }, () => [h(AuthPage)])
        ]);
    }
  });

  wrapper = mount(Host, {
    attachTo: document.body,
    global: {
      plugins: [router],
      components: { NuxtLink: RouterLink },
      stubs: { AuthJourney: AuthJourneyStub }
    }
  });
  await flushPromises();
  await new Promise(resolve => setTimeout(resolve, 0));
}

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
});

beforeEach(async () => {
  await mountGate();
}, 30000);

// -----------------------------------------------------------------------------

describe("the auth gate's header", () => {
  it("carries the title and nothing else", () => {
    const title = find(
      Array.from(document.body.querySelectorAll("h2")),
      node => (node.textContent ?? "").trim() === labs("auth_gate_title")
    );
    expect(title).toBeTruthy();

    const header = title?.parentElement;
    expect(header?.children).toHaveLength(1);
    expect(header?.querySelectorAll("button, a, input")).toHaveLength(0);
  });
});

describe("the auth gate's add rows", () => {
  it("offers exactly the four rows, keyed in order guest, guest-customer, client, staff", () => {
    const rendered = filter(
      Array.from(document.body.querySelectorAll("[data-test-key]")),
      node => includes(ADD_ROWS, node.getAttribute("data-test-key"))
    );

    expect(map(rendered, node => node.getAttribute("data-test-key"))).toEqual(
      ADD_ROWS
    );
  });

  it("labels each row as its action, in the catalogue's own words", () => {
    expect(rowLabel("actor-scope-add-guest")).toBe(
      labs("session_add_guest_another")
    );
    expect(rowLabel("actor-scope-add-guest-customer")).toBe(
      labs("auth_add_guest_customer")
    );
    expect(rowLabel("actor-scope-add-client")).toBe(labs("session_add_client"));
    expect(rowLabel("actor-scope-add-staff")).toBe(labs("session_add_staff"));
  });

  it("shows no journey, no form fields, and no Back on entry", () => {
    expect(journeyStub()).toBeNull();
    expect(document.body.querySelectorAll("input, textarea")).toHaveLength(0);
  });
});

describe("the auth gate's swap into the journey", () => {
  it("replaces the list with the journey targeted at the client, then Back restores the list", async () => {
    await clickRow("actor-scope-add-client");

    const stub = journeyStub();
    expect(stub).toBeTruthy();
    expect(stub?.getAttribute("data-actor")).toBe(AccessRoleTypes.CLIENT);
    expect(stub?.getAttribute("data-cancellable")).toBe("true");
    expect(rowByKey("actor-scope-add-client")).toBeNull();

    (stub as HTMLButtonElement).click();
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(journeyStub()).toBeNull();
    expect(rowByKey("actor-scope-add-client")).toBeTruthy();
  });

  it("targets the journey at the `user` actor when staff is chosen", async () => {
    await clickRow("actor-scope-add-staff");

    const stub = journeyStub();
    expect(stub?.getAttribute("data-actor")).toBe(AccessRoleTypes.STAFF);
    expect(stub?.getAttribute("data-cancellable")).toBe("true");
    expect(rowByKey("actor-scope-add-staff")).toBeNull();
  });
});
