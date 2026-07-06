// -----------------------------------------------------------------------------
/**
 * @fileoverview useAuth actions — UI→machine API contract (unit)
 *
 * ## Job To Be Done
 * Prove the action methods of the auth composable send the documented events
 * with the exact payloads the UI supplied, and that instance lifecycle
 * (destroy → fresh instance) holds — with the machine internals mocked.
 *
 * ## What Breaks If These Fail
 * Login/register forms silently stop delivering form data to the auth flow;
 * cancelled 2FA challenges stop restoring the login form; a destroyed flow
 * component resurrects a stale, inert auth instance on remount.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { ScopeActorTypes } from "../../scope";
import { useAuth } from "../useAuth";
import { sendMock } from "./mocks";

// -----------------------------------------------------------------------------

describe("useAuth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends SET event with the exact form data", () => {
    const auth = useAuth().as(ScopeActorTypes.CLIENT);
    const formData = { username: "test@example.com", password: "secret" };

    auth.useActions().set(formData);

    expect(sendMock).toHaveBeenCalledWith({
      type: "SET",
      data: formData
    });
  });

  it("sends CANCEL on reject()", () => {
    const auth = useAuth().as(ScopeActorTypes.CLIENT);

    auth.useActions().reject();

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "CANCEL" })
    );
  });

  it("evicts the instance so the next .as() is fresh", () => {
    const first = useAuth().as(ScopeActorTypes.CLIENT);
    const firstInternals = first.useInternals();

    first.useActions().destroy();

    const second = useAuth().as(ScopeActorTypes.CLIENT);
    const secondInternals = second.useInternals();

    expect(secondInternals).not.toBe(firstInternals);
  });
});
