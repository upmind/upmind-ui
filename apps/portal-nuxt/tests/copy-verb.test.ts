// -----------------------------------------------------------------------------
/**
 * @module tests/copy-verb
 * @description Plan R13's other half: `copy:<value>` is a DATASET-FREE verb —
 * what a row copies is the value the row was given, and the clipboard is the
 * browser's, not the mock's. It answers with a toast either way; a browser
 * with no clipboard must degrade, never throw.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";

const NO_CONTEXT = {};

const COPIED_VALUE = "hello";

function setClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    value: clipboard,
    configurable: true,
    writable: true
  });
}

function copy(value: string) {
  return dispatchMockAction(
    undefined,
    NO_CONTEXT,
    mockActionValue(MOCK_ACTION.COPY, value)
  );
}

describe("the copy verb — dataset-free, clipboard-optional", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("writes the value to the clipboard and confirms it, with no dataset in play", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    const result = copy(COPIED_VALUE);
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(COPIED_VALUE)
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(result?.toast?.title).toBe("Copied");
  });

  it("copies the value it was GIVEN, not a fixed one", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    copy("INV-1042-QX");
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("INV-1042-QX")
    );
  });

  it("still confirms, and does not throw, where the browser offers no clipboard", () => {
    setClipboard(undefined);

    let result: ReturnType<typeof copy>;
    expect(() => {
      result = copy(COPIED_VALUE);
    }).not.toThrow();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(result?.toast?.title).toBe("Copied");
  });

  it("survives a clipboard that rejects the write", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    setClipboard({ writeText });

    let result: ReturnType<typeof copy>;
    expect(() => {
      result = copy(COPIED_VALUE);
    }).not.toThrow();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("a copy with no payload is a no-op", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    expect(
      dispatchMockAction(undefined, NO_CONTEXT, MOCK_ACTION.COPY)
    ).toBeUndefined();
    expect(writeText).not.toHaveBeenCalled();
  });
});
