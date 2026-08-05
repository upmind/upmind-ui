/**
 * @fileoverview useAccount meta — scope matrix + flag derivations (unit)
 *
 * ## Job To Be Done
 * Prove the account surface is client-only per ACCOUNT_SCOPE_MATRIX and that
 * the form-visibility flags derive from the documented state+formType
 * conditions — machine state mocked.
 *
 * ## What Breaks If These Fail
 * Staff/guest actors get standing forms they cannot submit; the guest upgrade
 * and guest-email forms show simultaneously or not at all.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { ScopeActorTypes } from "../../scope";
import {
  ACCOUNT_SCOPE_MATRIX,
  AccountContextTypes,
  ClientFormType
} from "../account.types";
import { useAccount } from "../useAccount";
import {
  contextValueMock,
  stateMatchesMock,
  useContextMock,
  useStateMatchesMock
} from "./mocks";

// -----------------------------------------------------------------------------

function mockStateAs(fragment: string): void {
  const matches = (path: unknown): boolean =>
    (Array.isArray(path) ? path : [path]).some(p =>
      String(p).includes(fragment)
    );
  stateMatchesMock.mockImplementation(((_state: unknown, path: unknown) =>
    matches(path)) as never);
  useStateMatchesMock.mockImplementation(((_state: unknown, path: unknown) => ({
    value: matches(path)
  })) as never);
}

describe("useAccount meta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateMatchesMock.mockReturnValue(false);
    useStateMatchesMock.mockReturnValue({ value: false });
    contextValueMock.mockReturnValue(undefined);
    useContextMock.mockReturnValue({ value: undefined });
    useAccount().as(ScopeActorTypes.CLIENT).useActions().destroy();
  });

  it("scope matrix: self/guest → null, staff/client → CLIENT", () => {
    // acct-usage §Getting an instance 🧪 — exported constant, account.types.
    // Keyed by enum VALUE (ScopeActorTypes.STAFF resolves to "user"), so the
    // assertions use computed keys, never string literals (code-style.md).
    expect(ACCOUNT_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(ACCOUNT_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
    expect(ACCOUNT_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBe(
      AccountContextTypes.CLIENT
    );
    expect(ACCOUNT_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      AccountContextTypes.CLIENT
    );

    // acct-gotchas §4 🧪 — unsupported scope yields no client lifecycle
    const guestInstance = useAccount().as(ScopeActorTypes.GUEST);
    expect(guestInstance.useMeta().canShowForms.value).toBe(false);
  });

  it("showGuestUpgradeForm requires unregistered AND formType REGISTER", () => {
    mockStateAs("unregistered");
    contextValueMock.mockReturnValue(ClientFormType.REGISTER as never);
    useContextMock.mockReturnValue({ value: ClientFormType.REGISTER } as never);

    const meta = useAccount().as(ScopeActorTypes.CLIENT).useMeta();

    expect(meta.showGuestUpgradeForm.value).toBe(true);
    expect(meta.showGuestEmailForm.value).toBe(false);

    contextValueMock.mockReturnValue(ClientFormType.EMAIL as never);
    useContextMock.mockReturnValue({ value: ClientFormType.EMAIL } as never);
    const metaEmail = useAccount().as(ScopeActorTypes.CLIENT).useMeta();

    expect(metaEmail.showGuestUpgradeForm.value).toBe(false);
    expect(metaEmail.showGuestEmailForm.value).toBe(true);
  });

  it("canShowForms false when unavailable", () => {
    mockStateAs("unavailable");
    contextValueMock.mockReturnValue(ClientFormType.REGISTER as never);
    useContextMock.mockReturnValue({ value: ClientFormType.REGISTER } as never);

    const meta = useAccount().as(ScopeActorTypes.CLIENT).useMeta();

    expect(meta.canShowForms.value).toBe(false);
  });
});
