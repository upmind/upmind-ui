// -----------------------------------------------------------------------------
/**
 * @module tests/security-forms
 * @description Gap doc §4 "Security": the three writes legacy kept behind forms
 * — change username, change password, turn two-factor on or off — plus the
 * address whitelist's add (plan §3 rows). The equality rule the platform's ajv
 * cannot express is the facade's refusal, not a schema error (plan F5), and the
 * page offers whichever two-factor control the account's own state allows.
 * `security-ip-whitelist.test.ts` grades what the panel LISTS; this grades what
 * the forms WRITE.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { boundRefId, rowBinding } from "./support/page-config";
import { cloneDeep, find, first, keys, map } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import * as twofaSchemas from "~/portal/mock/contracts/auth.schemas.twofa";
import * as ipWhitelistSchemas from "~/portal/mock/contracts/client-ip-whitelist.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT = {};

const TODAY = new Date().toISOString().slice(0, 10);

const SIX_DIGITS = "123456";

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function securityPage(): unknown {
  return accountPages()[PAGE_KEY.ACCOUNT_SECURITY];
}

function ref(data: MockDataset, id: DataRefId): unknown {
  return resolveDataRefProps({ value: dataRef(id) }, data)?.value;
}

function payload(verb: string, model: unknown): string {
  return `${verb}:${JSON.stringify(model)}`;
}

function toastText(result: {
  toast?: { title: string; description?: string };
}): string {
  return `${result.toast?.title ?? ""} ${result.toast?.description ?? ""}`;
}

/** The props of the `form` module in the page row bound to `id`. */
function formProps(page: unknown, id: DataRefId): ConfigNode | undefined {
  const slots = rowBinding(page, id)?.slots;
  if (!Array.isArray(slots)) return undefined;
  const slot = slots.find(
    candidate =>
      typeof candidate === "object" &&
      candidate !== null &&
      (candidate as ConfigNode).id === "form"
  );
  if (typeof slot !== "object" || slot === null) return undefined;
  const props = (slot as ConfigNode).props;
  if (typeof props !== "object" || props === null) return undefined;
  return props as ConfigNode;
}

/** The two-factor code field's own name — the real schema's, not this test's. */
function tokenKey(): string {
  const key = first(keys(twofaSchemas.twoFactorDefaults()));
  if (key === undefined) throw new Error("the 2FA form opens on no field");
  return key;
}

describe("changing the name the client signs in with", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the security page binds the username form to its own verb", () => {
    const props = formProps(securityPage(), DATA_REF_ID.USERNAME_FORM_MODEL);

    expect(props?.submit).toBe(MOCK_ACTION.USERNAME_CHANGE);
    expect(boundRefId(props, "schema")).toBe(DATA_REF_ID.USERNAME_FORM_SCHEMA);
    expect(boundRefId(props, "uischema")).toBe(
      DATA_REF_ID.USERNAME_FORM_UISCHEMA
    );
    expect(props?.submitLabel).toBeTruthy();
  });

  it("the form opens on the name the account signs in with today", () => {
    const data = hostgrid();

    expect(ref(data, DATA_REF_ID.USERNAME_FORM_MODEL)).toEqual({
      username: data.persona.username
    });
  });

  it("a new name is written onto the persona, and said back", () => {
    const data = hostgrid();

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.USERNAME_CHANGE, { username: "kestrel" })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(toastText(result ?? {})).toContain("kestrel");
    expect(data.persona.username).toBe("kestrel");
    expect(ref(data, DATA_REF_ID.USERNAME_FORM_MODEL)).toEqual({
      username: "kestrel"
    });
  });

  it("a name that is only whitespace is refused, and nothing changes", () => {
    const data = hostgrid();
    const before = data.persona.username;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.USERNAME_CHANGE, { username: "   " })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.EMPTY_NAME]
    );
    expect(data.persona.username).toBe(before);
  });
});

describe("changing the password", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("the security page binds the password form to its own verb", () => {
    const props = formProps(securityPage(), DATA_REF_ID.PASSWORD_FORM_MODEL);

    expect(props?.submit).toBe(MOCK_ACTION.PASSWORD_CHANGE);
    expect(boundRefId(props, "schema")).toBe(DATA_REF_ID.PASSWORD_FORM_SCHEMA);
    expect(boundRefId(props, "uischema")).toBe(
      DATA_REF_ID.PASSWORD_FORM_UISCHEMA
    );
    expect(props?.submitLabel).toBeTruthy();
  });

  it("two matching entries move the account's password date to today", () => {
    const data = hostgrid();
    const model = ref(data, DATA_REF_ID.PASSWORD_FORM_MODEL);
    const typed = map(keys(model), key => [key, "Sup3rSecret!"]);

    expect(keys(model).length).toBe(2);
    expect(data.security.passwordChangedAt).not.toBe(TODAY);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.PASSWORD_CHANGE, Object.fromEntries(typed))
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(data.security.passwordChangedAt).toBe(TODAY);
  });

  it("two that differ are refused, and the date stays where it was", () => {
    const data = hostgrid();
    const model = ref(data, DATA_REF_ID.PASSWORD_FORM_MODEL);
    const [password, confirm] = keys(model);
    const before = data.security.passwordChangedAt;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.PASSWORD_CHANGE, {
        [password ?? ""]: "Sup3rSecret!",
        [confirm ?? ""]: "Sup3rSecret?"
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.PASSWORD_MISMATCH]
    );
    expect(data.security.passwordChangedAt).toBe(before);
  });
});

describe("the second step at sign-in", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("a six-digit code turns it on, and says what changes next time", () => {
    const data = hostgrid();
    data.security.twoFactorEnabled = false;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.TWOFA_ENABLE, { [tokenKey()]: SIX_DIGITS })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(data.security.twoFactorEnabled).toBe(true);
  });

  it("anything that is not six digits is refused, and it stays off", () => {
    const data = hostgrid();
    data.security.twoFactorEnabled = false;

    for (const code of ["12345", "1234567", "abcdef", ""]) {
      const result = dispatchMockAction(
        data,
        NO_CONTEXT,
        payload(MOCK_ACTION.TWOFA_ENABLE, { [tokenKey()]: code })
      );

      expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
      expect(toastText(result ?? {})).toContain(
        MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.INVALID_TWO_FACTOR_CODE]
      );
      expect(data.security.twoFactorEnabled).toBe(false);
    }
  });

  it("the schema refuses the same codes before one is ever sent", () => {
    const validate = usePortalAjv().compile(twofaSchemas.useTwoFASchema());

    expect(validate({ [tokenKey()]: SIX_DIGITS })).toBe(true);
    expect(validate({ [tokenKey()]: "12345" })).toBe(false);
    expect(validate({ [tokenKey()]: "abcdef" })).toBe(false);
    expect(validate({})).toBe(false);
  });

  it("turning it off asks for the code, refuses a wrong one, and turns off with the right one", () => {
    const data = hostgrid();
    data.security.twoFactorEnabled = true;

    const entry = resolveMockForm(data, FORM_ID.TWOFA_DISABLE, undefined);
    expect(entry?.submit).toBe(MOCK_ACTION.TWOFA_DISABLE);
    expect(keys(entry?.model)).toContain(tokenKey());

    const refused = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.TWOFA_DISABLE, { [tokenKey()]: "12345" })
    );

    expect(refused?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(toastText(refused ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.INVALID_TWO_FACTOR_CODE]
    );
    expect(data.security.twoFactorEnabled).toBe(true);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.TWOFA_DISABLE, { [tokenKey()]: SIX_DIGITS })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(data.security.twoFactorEnabled).toBe(false);
  });

  it("the page offers only the control the account's own state allows", () => {
    const data = hostgrid();

    data.security.twoFactorEnabled = false;
    const off = ref(data, DATA_REF_ID.SECURITY_TWOFA_ACTIONS);
    expect(map(off, "value")).toEqual([
      `${MOCK_ACTION.OPEN_FORM}:${FORM_ID.TWOFA_ENABLE}`
    ]);
    expect(map(off, "label")).toEqual(["Turn on two-factor"]);

    data.security.twoFactorEnabled = true;
    const on = ref(data, DATA_REF_ID.SECURITY_TWOFA_ACTIONS);
    expect(map(on, "value")).toEqual([
      `${MOCK_ACTION.OPEN_FORM}:${FORM_ID.TWOFA_DISABLE}`
    ]);
    expect(map(on, "label")).toEqual(["Turn off two-factor"]);
  });
});

describe("restricting sign-in to an address", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("a new address joins the list, and is said back", () => {
    const data = hostgrid();
    const before = data.ipWhitelist.length;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.IP_WHITELIST_CREATE, {
        ipAddress: "203.0.113.9",
        description: "Kiln studio"
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(toastText(result ?? {})).toContain("203.0.113.9");
    expect(data.ipWhitelist.length).toBe(before + 1);

    const added = find(data.ipWhitelist, { ip_address: "203.0.113.9" });
    expect(added?.name).toBe("Kiln studio");
  });

  it("an address the account already restricts to is refused", () => {
    const data = hostgrid();
    const seeded = first(data.ipWhitelist);
    const before = cloneDeep(data.ipWhitelist);

    expect(seeded).toBeDefined();
    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload(MOCK_ACTION.IP_WHITELIST_CREATE, {
        ipAddress: seeded?.ip_address,
        description: "Again"
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(toastText(result ?? {})).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.DUPLICATE_CONTACT]
    );
    expect(data.ipWhitelist).toEqual(before);
  });

  it("the schema takes either family, and refuses what is not an address", () => {
    const validate = usePortalAjv().compile(ipWhitelistSchemas.useSchema());

    expect(validate({ ipAddress: "82.14.210.7" })).toBe(true);
    expect(validate({ ipAddress: "2001:db8:85a3::8a2e:370:7334" })).toBe(true);
    expect(
      validate({ ipAddress: "2001:0db8:85a3:0000:0000:8a2e:0370:7334" })
    ).toBe(true);
    expect(validate({ ipAddress: "999.999.999.999" })).toBe(false);
    expect(validate({ ipAddress: "not-an-address" })).toBe(false);
    expect(validate({ description: "no address at all" })).toBe(false);
  });
});

describe("a half-typed payload is not a write", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("every security verb answers nothing and changes nothing", () => {
    const data = hostgrid();
    const before = cloneDeep(data);

    for (const value of [
      `${MOCK_ACTION.USERNAME_CHANGE}:{"username":`,
      `${MOCK_ACTION.PASSWORD_CHANGE}:{`,
      `${MOCK_ACTION.TWOFA_ENABLE}:not-json`,
      `${MOCK_ACTION.IP_WHITELIST_CREATE}:{"ipAddress":`
    ]) {
      expect(dispatchMockAction(data, NO_CONTEXT, value)).toBeUndefined();
    }

    expect(data).toEqual(before);
  });
});
