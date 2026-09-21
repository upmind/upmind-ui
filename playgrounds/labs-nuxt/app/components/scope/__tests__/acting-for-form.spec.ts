// -----------------------------------------------------------------------------
/**
 * @module components/scope/__tests__/acting-for-form.spec
 * @description FE-3031 — a page's own "Act for" form drives the scope url.
 *
 * ## Job To Be Done
 * The module publishes a lookups form; the bar renders it. A write into that
 * form is one scope write: the url gains `/for/:type/:id`, and the surface
 * query already on the url rides along. The clear takes the same road back.
 *
 * ## What Breaks If These Fail
 * A pick lands on a url the page cannot read, or drops the view the operator
 * had open — and every filter, column and track choice resets on each pick.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  seedPool,
  benchOn,
  flush,
  headlessDouble,
  node,
  openPanel,
  resetDom,
  CLIENT_EMAILS_ROUTE,
  type Bench
} from "./harness";
import type { ScopeContextForm } from "../useContextScopeSelector";

vi.mock("@upmind-automation/headless", async () =>
  headlessDouble(await vi.importActual("@upmind-automation/headless"))
);

// -----------------------------------------------------------------------------

const POOL = [
  { id: "client-1", actor: AccessRoleTypes.CLIENT, publicName: "Client One" }
];

const SCOPE_PATH = `/${CLIENT_EMAILS_ROUTE}/as/client`;
const SURFACE_QUERY = "?view=cards";

/** One plain field over the `contract` context — the smallest form a module can publish. */
const CONTRACT_FORM: ScopeContextForm = {
  schema: {
    type: "object",
    properties: { contract: { type: ["string", "null"] } }
  },
  uischema: {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/contract",
        i18n: "form.contract_lookup"
      }
    ]
  } as ScopeContextForm["uischema"]
};

async function benchOnForm(): Promise<{ bench: Bench; panel: HTMLElement }> {
  const { ScopeActorTypes } = await import("@upmind-automation/headless");

  seedPool(POOL, { active: "client-1" });

  const { default: ActingForSegment } = await import("../ActingForSegment.vue");
  const bench = await benchOn(
    ActingForSegment,
    `${SCOPE_PATH}${SURFACE_QUERY}`,
    {
      [ScopeActorTypes.SELF]: null as never,
      [ScopeActorTypes.STAFF]: null as never,
      [ScopeActorTypes.CLIENT]: ["contract"],
      [ScopeActorTypes.GUEST]: null as never
    },
    CONTRACT_FORM
  );

  return { bench, panel: await openPanel("acting-for") };
}

function formInput(panel: HTMLElement): HTMLInputElement {
  const input = panel.querySelector<HTMLInputElement>("input");
  if (!input) throw new Error("the Act-for form rendered no input");
  return input;
}

describe("the module's Act-for form writes the scope url", () => {
  let bench: Bench;

  afterEach(() => {
    bench?.wrapper.unmount();
    resetDom();
  });

  it("a form write becomes /for/:type/:id and keeps the surface query", async () => {
    const opened = await benchOnForm();
    bench = opened.bench;

    const input = formInput(opened.panel);
    input.value = "c1";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    await flush();
    await flush();

    expect(bench.router.currentRoute.value.fullPath).toBe(
      `${SCOPE_PATH}/for/contract/c1${SURFACE_QUERY}`
    );
  });

  it("the clear takes the same road back, query intact", async () => {
    const opened = await benchOnForm();
    bench = opened.bench;

    const input = formInput(opened.panel);
    input.value = "c1";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    await flush();
    await flush();

    const clear = node("acting-for-clear");
    if (!clear) throw new Error("no clear control after the pick");
    clear.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await flush();
    await flush();

    expect(bench.router.currentRoute.value.fullPath).toBe(
      `${SCOPE_PATH}${SURFACE_QUERY}`
    );
  });

  it("the form replaces the plain id fields", async () => {
    const opened = await benchOnForm();
    bench = opened.bench;

    expect(node("acting-for-id-input")).toBeNull();
    expect(formInput(opened.panel)).not.toBeNull();
  });
});
