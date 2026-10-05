// -----------------------------------------------------------------------------
/**
 * @fileoverview The scopes the portal boots the headless runtime with.
 *
 * ## Job To Be Done
 * The portal boots for clients only: it asks for no guest scope, so it opens no
 * guest session at start-up and registration carries no guest token.
 *
 * ## What Breaks If These Fail
 * Every visitor to the portal's sign-in pages mints a guest session the portal
 * never uses.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import { assign, get, last } from "lodash-es";

// -----------------------------------------------------------------------------

const { init } = vi.hoisted(() => ({ init: vi.fn(() => Promise.resolve()) }));

vi.mock("#app", () => ({
  defineNuxtPlugin: (setup: () => void) => setup,
  useRouter: () => ({}),
  useRuntimeConfig: () => ({ public: {} })
}));

vi.mock("@upmind-automation/headless", async importOriginal =>
  assign(
    {},
    await importOriginal<typeof import("@upmind-automation/headless")>(),
    { default: { init } }
  )
);

vi.mock("~/portal/i18n", () => ({ default: {} }));

async function bootedScopes(): Promise<unknown> {
  const { default: boot } = await import("~/plugins/upmind.client");
  boot();
  return get(last(init.mock.calls), [0, "allowedScopes"]);
}

describe("the scopes the portal boots with", () => {
  beforeEach(() => {
    init.mockClear();
  });

  it("boots for clients", async () => {
    expect(await bootedScopes()).toContain(AccessRoleTypes.CLIENT);
  });

  it("asks for no guest scope", async () => {
    expect(await bootedScopes()).not.toContain(AccessRoleTypes.GUEST);
  });
});
