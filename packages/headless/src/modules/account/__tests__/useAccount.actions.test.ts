/**
 * @fileoverview useAccount actions — UI→machine API contract (unit)
 *
 * ## Job To Be Done
 * Prove the standing-arc actions deliver the documented events with the exact
 * form payloads (registration model, verify code), and that destroy() evicts
 * the cached instance — machine internals mocked.
 *
 * ## What Breaks If These Fail
 * The guest-upgrade form submits without its data; verification codes never
 * reach the flow; unmounted account components leave stale instances that the
 * next mount resurrects.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { useAccount } from "../useAccount";
import { sendMock } from "./mocks";
import type { CompleteRegistrationModel } from "../account.types";

// -----------------------------------------------------------------------------

describe("useAccount actions", () => {
  beforeEach(() => {
    useAccount().as("client").useActions().destroy();
    vi.clearAllMocks();
  });

  it("register(model) sends COMPLETE_REGISTRATION with the model payload", () => {
    const account = useAccount().as("client");
    const model: CompleteRegistrationModel = {
      email: "guest@example.com",
      firstname: "Guest",
      lastname: "Checkout",
      password: "s3cret-passw0rd"
    };

    account.useActions().register(model);

    expect(sendMock).toHaveBeenCalledWith({
      type: "COMPLETE_REGISTRATION",
      data: model
    });
  });

  it("verify(model) sends VERIFY with the code payload", () => {
    const account = useAccount().as("client");

    account.useActions().verify({ code: "123456" });

    expect(sendMock).toHaveBeenCalledWith({
      type: "VERIFY",
      data: { code: "123456" }
    });
  });

  it("destroy() evicts the instance so the next .as() is fresh", () => {
    const first = useAccount().as("client");
    const firstInternals = first.useInternals();

    first.useActions().destroy();

    const second = useAccount().as("client");
    const secondInternals = second.useInternals();

    expect(secondInternals).not.toBe(firstInternals);
  });
});
