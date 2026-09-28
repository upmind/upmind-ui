// -----------------------------------------------------------------------------
/**
 * @fileoverview useAuth actions — UI→machine API contract (unit)
 *
 * ## Job To Be Done
 * Prove the action methods of the auth composable send the documented events
 * with the exact payloads the UI supplied, that instance lifecycle
 * (destroy → fresh instance) holds, and that a successful login, 2FA or
 * register `resolve()` settles only once the session store promotes the
 * session — with the machine internals mocked.
 *
 * ## What Breaks If These Fail
 * Login/register forms silently stop delivering form data to the auth flow;
 * cancelled 2FA challenges stop restoring the login form; a destroyed flow
 * component resurrects a stale, inert auth instance on remount; a host hands
 * back while the visitor is still a guest, or hangs on a user load that failed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { ScopeActorTypes } from "../../scope";
import { useAuth } from "../useAuth";
import {
  sendMock,
  stateMatchesMock,
  waitForProcessingMock,
  whenAuthenticatedMock
} from "./mocks";
import type { AuthModel } from "../auth.types";

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

function onState(current: string): void {
  stateMatchesMock.mockImplementation((...args: unknown[]) => {
    const path = args[1];
    return (
      typeof path === "string" &&
      (current === path || current.startsWith(`${path}.`))
    );
  });
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(settle => {
    resolve = settle;
  });
  return { promise, resolve };
}

const SIGN_INS: { name: string; state: string; model: AuthModel }[] = [
  {
    name: "login",
    state: "login",
    model: { username: "jane@example.com", password: "s3cret-pass" }
  },
  {
    name: "2FA",
    state: "login.challenging",
    model: { token: "123456" }
  },
  {
    name: "register",
    state: "register",
    model: {
      username: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      password: "s3cret-pass"
    }
  }
];

describe("useAuth resolve() hand-back timing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stateMatchesMock.mockImplementation(() => false);
    waitForProcessingMock.mockImplementation(async () => true);
    whenAuthenticatedMock.mockImplementation(async () => ({ id: "client-1" }));
  });

  for (const signIn of SIGN_INS) {
    describe(`a ${signIn.name}`, () => {
      it("stays pending until the session promotes, then gives true", async () => {
        onState(signIn.state);
        waitForProcessingMock.mockImplementation(async () => true);
        const promotion = deferred<{ id: string }>();
        whenAuthenticatedMock.mockImplementation(() => promotion.promise);
        const settled = vi.fn();

        const result = useAuth()
          .as(ScopeActorTypes.CLIENT)
          .useActions()
          .resolve(signIn.model)
          .then(value => {
            settled(value);
            return value;
          });
        await vi.waitFor(() =>
          expect(whenAuthenticatedMock).toHaveBeenCalledTimes(1)
        );
        await new Promise(tick => setTimeout(tick, 0));

        expect(settled).not.toHaveBeenCalled();

        promotion.resolve({ id: "client-1" });

        await expect(result).resolves.toBe(true);
      });

      it("rejects when the user load fails", async () => {
        onState(signIn.state);
        waitForProcessingMock.mockImplementation(async () => true);
        whenAuthenticatedMock.mockImplementation(async () => {
          throw new Error("user load failed");
        });

        await expect(
          useAuth()
            .as(ScopeActorTypes.CLIENT)
            .useActions()
            .resolve(signIn.model)
        ).rejects.toThrow("user load failed");
      });
    });
  }

  it("gives false for a failed login without waiting for the session", async () => {
    onState("login");
    waitForProcessingMock.mockImplementation(async () => false);

    const ok = await useAuth()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .resolve({ username: "jane@example.com", password: "wrong-password" });

    expect(ok).toBe(false);
    expect(whenAuthenticatedMock).not.toHaveBeenCalled();
  });

  it("never waits for the session on a recovery request", async () => {
    onState("recover");
    waitForProcessingMock.mockImplementation(async () => true);

    const ok = await useAuth()
      .as(ScopeActorTypes.CLIENT)
      .useActions()
      .resolve({ username: "jane@example.com" });

    expect(ok).toBe(true);
    expect(whenAuthenticatedMock).not.toHaveBeenCalled();
  });
});
