// -----------------------------------------------------------------------------
/**
 * @fileoverview usePaymentGateway actions — what a consumer's hand sends
 *
 * ## Job To Be Done
 * Cells A and D of `payment-gateways.feature` say a consumer clears, captures,
 * submits and draws a gateway through one API, whatever the provider behind it.
 * This file pins the API contract between that hand and the machine: which
 * event each call sends, and which calls deliberately send nothing.
 *
 * ## What this layer deliberately does not prove
 * That the production machine acts on those events — that is the integration
 * layer's, with the real machine and recorded provider responses.
 *
 * ## What Breaks If These Fail
 * A client's card details never reach the gateway, a submitted payment is
 * re-captured and double-charged, or a hosted form is asked to draw twice.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config", () => ({
  useConfig: () => ({ data: { clickwrapDisclaimer: "" } })
}));

vi.mock("../../system-localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

import { usePaymentGateway } from "../usePaymentGateway";
import { spawnGateway } from "./gateway.doubles";

// -----------------------------------------------------------------------------

const CARD = { number: "4242424242424242", cvv: "123" };

/** A provider SDK handle, as a gateway that draws its own form carries one. */
const SDK = { mount: () => {} };

/**
 * `render` resolves before its own inner wait — see FE-3130. Poll the spy
 * instead of trusting the returned promise.
 */
async function settleRender(): Promise<void> {
  for (let tick = 0; tick < 20; tick++) {
    await new Promise(resolve => setTimeout(resolve, 25));
  }
}

// -----------------------------------------------------------------------------

describe("usePaymentGateway — waiting for a gateway to settle", () => {
  it("AC-A3 tells a consumer the gateway is ready once it settles available", async () => {
    const { actor, service } = spawnGateway("loading", { supported: true });
    const { isReady } = usePaymentGateway(actor);

    const ready = isReady();
    service.send({ type: "SETTLE" });

    await expect(ready).resolves.toBe(true);
  });

  it("AC-A4 tells a consumer the gateway is not ready once it settles unavailable", async () => {
    const { actor, service } = spawnGateway("loading", { supported: true });
    const { isReady } = usePaymentGateway(actor);

    const ready = isReady();
    service.send({ type: "FAIL" });

    await expect(ready).resolves.toBe(false);
  });
});

describe("usePaymentGateway — capturing and clearing what a client enters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AC-A7 clears the gateway when a client discards what they entered", () => {
    const { actor, send } = spawnGateway("available", { model: CARD });
    const { clear } = usePaymentGateway(actor);

    clear();

    expect(send).toHaveBeenCalledWith({ type: "CLEAR" });
  });

  it("AC-A6 captures what a client enters without asking the gateway to proceed", () => {
    const { actor, send } = spawnGateway("available", {});
    const { input } = usePaymentGateway(actor);

    input(CARD);

    expect(send).toHaveBeenCalledWith({ type: "SET", data: CARD });
    expect(send).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "UPDATE" })
    );
  });

  it("AC-A10 asks an unchanged gateway to proceed rather than re-capturing it", async () => {
    const { actor, send, service } = spawnGateway("available", { model: CARD });
    const { update } = usePaymentGateway(actor);

    const done = update({ ...CARD });
    service.send({ type: "PROCESS" });
    service.send({ type: "DONE" });
    await done;

    expect(send).toHaveBeenCalledWith({ type: "UPDATE" });
    expect(send).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET" })
    );
  });

  it("AC-A11 re-captures changed details before the gateway proceeds", async () => {
    const { actor, send, service } = spawnGateway("available", { model: CARD });
    const { update } = usePaymentGateway(actor);

    const changed = { ...CARD, cvv: "999" };
    const done = update(changed);
    service.send({ type: "PROCESS" });
    service.send({ type: "DONE" });
    await done;

    expect(send).toHaveBeenCalledWith({
      type: "SET",
      data: changed,
      update: true
    });
  });

  it("AC-A11 sends nothing when a client submits an empty change", async () => {
    const { actor, send } = spawnGateway("available", { model: CARD });
    const { update } = usePaymentGateway(actor);

    await update(null);

    expect(send).not.toHaveBeenCalled();
  });

  it("AC-A13 surfaces the refusal to the client when the provider refuses", async () => {
    const { actor, service } = spawnGateway("available", {
      model: CARD,
      error: { message: "Your card was declined." }
    });
    const { update } = usePaymentGateway(actor);

    const done = update({ ...CARD });
    service.send({ type: "PROCESS" });
    service.send({ type: "REFUSE" });

    await expect(done).rejects.toMatchObject({
      message: "Your card was declined."
    });
  });
});

describe("usePaymentGateway — drawing a gateway's own hosted form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AC-D1 asks a gateway that draws its own form to draw it in the offered place", async () => {
    const { actor, send } = spawnGateway("rendering", { sdk: SDK });
    const { render } = usePaymentGateway(actor);
    const container = document.createElement("div");

    await render(container);
    await settleRender();

    expect(send).toHaveBeenCalledWith({ type: "RENDER", data: { container } });
  });

  it("AC-D2 reports the fault and fails no payment when offered nowhere to draw", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { actor, send } = spawnGateway("rendering", { sdk: SDK });
    const { render } = usePaymentGateway(actor);

    await expect(render(null)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("AC-D3 never asks a gateway that needs no form to draw one", async () => {
    const { actor, send } = spawnGateway("rendering", {
      sdk: SDK,
      renderless: true
    });
    const { render } = usePaymentGateway(actor);

    await render(document.createElement("div"));
    await settleRender();

    expect(send).not.toHaveBeenCalled();
  });

  it("AC-D3 never asks a gateway carrying no provider SDK to draw one", async () => {
    const { actor, send } = spawnGateway("rendering", {});
    const { render } = usePaymentGateway(actor);

    await render(document.createElement("div"));
    await settleRender();

    expect(send).not.toHaveBeenCalled();
  });
});
