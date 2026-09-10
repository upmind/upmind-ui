import { describe, expect, it } from "vitest";
import type { MockDataset } from "~/portal/mock/types";
import { MOCK_ACTION, dispatchMockAction } from "~/portal/mock/actions";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";

/** Legacy's account screens, graded on vue-app 1.74.0 — the rows `docs/legacy-parity-products.md` sends here. */

function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

describe("a username or password change waits on the emailed code", () => {
  const change = `${MOCK_ACTION.USERNAME_CHANGE}:${JSON.stringify({ username: "jonah.reyes" })}`;

  it("opens the code prompt instead of changing anything", () => {
    const data = clone();
    const before = data.persona.username;
    const result = dispatchMockAction(data, {}, change);
    expect(result?.form?.id).toBe(FORM_ID.SENSITIVE_CODE);
    expect(result?.form?.entityId).toBe(change);
    expect(data.persona.username).toBe(before);
  });

  it("refuses a code that is not six digits, and lands the change on one that is", () => {
    const data = clone();
    const confirm = (token: string) =>
      dispatchMockAction(
        data,
        {},
        `${MOCK_ACTION.SENSITIVE_CODE_CONFIRM}:${change}:${JSON.stringify({ token })}`
      );
    const refused = confirm("12");
    expect(refused?.toast?.title).toMatch(/code/i);
    expect(data.persona.username).not.toBe("jonah.reyes");
    const landed = confirm("123456");
    expect(landed?.toast?.title).toBe("Username changed");
    expect(data.persona.username).toBe("jonah.reyes");
  });
});
