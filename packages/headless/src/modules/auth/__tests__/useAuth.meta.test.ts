// -----------------------------------------------------------------------------
/**
 * @fileoverview useAuth meta — capability rules per scope (unit)
 *
 * ## Job To Be Done
 * Prove the capability flags (canLogin/canRegister/canRecover/
 * canRegisterAsGuest) follow the documented scope and brand rules, with
 * machine state mocked.
 *
 * ## What Breaks If These Fail
 * Register/recover forms render for impersonation sessions; guest checkout
 * offers itself on brands that disabled it; already-authenticated users are
 * offered a login form.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { BrandConfigKeys } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope";
import { AuthContextTypes } from "../auth.types";
import { useAuth } from "../useAuth";
import {
  brandConfig,
  contextMatchesMock,
  stateMatchesMock,
  useStateMatchesMock
} from "./mocks";

// -----------------------------------------------------------------------------

describe("useAuth meta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateMatchesMock.mockReturnValue(false);
    useStateMatchesMock.mockReturnValue({ value: false });
    contextMatchesMock.mockReturnValue(false);
    brandConfig[BrandConfigKeys.GUEST_CHECKOUT_ENABLED] = true;
  });

  it("allows login, register, recover for clients", () => {
    const meta = useAuth().as(ScopeActorTypes.CLIENT).useMeta();

    expect(meta.canLogin.value).toBe(true);
    expect(meta.canRegister.value).toBe(true);
    expect(meta.canRecover.value).toBe(true);
  });

  it("disables capabilities when already authenticated", () => {
    useStateMatchesMock.mockReturnValue({ value: true } as never);

    const meta = useAuth().as(ScopeActorTypes.CLIENT).useMeta();

    expect(meta.canLogin.value).toBe(false);
    expect(meta.canRegister.value).toBe(false);
    expect(meta.canRecover.value).toBe(false);
  });

  it("register/recover are self-only — false under a scopeContext", () => {
    contextMatchesMock.mockReturnValue(true);

    const meta = useAuth()
      .as(ScopeActorTypes.STAFF)
      .for(AuthContextTypes.CLIENT, "client-456")
      .useMeta();

    expect(meta.canRegister.value).toBe(false);
    expect(meta.canRecover.value).toBe(false);
  });

  it("canRegisterAsGuest follows the brand toggle", () => {
    brandConfig[BrandConfigKeys.GUEST_CHECKOUT_ENABLED] = true;
    const enabled = useAuth().as(ScopeActorTypes.CLIENT).useMeta();
    expect(enabled.canRegisterAsGuest.value).toBe(true);

    brandConfig[BrandConfigKeys.GUEST_CHECKOUT_ENABLED] = false;
    const disabled = useAuth().as(ScopeActorTypes.CLIENT).useMeta();
    expect(disabled.canRegisterAsGuest.value).toBe(false);
  });
});
