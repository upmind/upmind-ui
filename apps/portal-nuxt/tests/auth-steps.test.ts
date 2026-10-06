// -----------------------------------------------------------------------------
/**
 * The three logged-out screens no domain package serves, mocked as
 * legacy drew them: the reset link's new password, the verification link's
 * outcomes, and the organisation sign-up. Oracle: vue-app 1.74.0,
 * `views/client/auth/{resetPassword,verify,verifyEmail,registerOrg}`.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { boundRefId, rowBinding, stringsIn } from "./support/page-config";
import { assign, get, includes, map } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import { authPages } from "~/portal/config/auth-pages";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import { useRegisterOrgSchema } from "~/portal/mock/contracts/auth.schemas.register-org";
import { useResetPasswordSchema } from "~/portal/mock/contracts/auth.schemas.reset";
import { DATA_REF_ID, dataRef, resolveDataRef } from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import { PORTAL_FORM_CURRENCIES } from "~/portal/mock/forms/engine-data";
import { PACKAGE_STUB_TITLE } from "~/portal/mock/package-stub";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NEW_PASSWORD = "harbour-lights-2026";

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function formValue(verb: string, model: unknown): string {
  return `${verb}:${JSON.stringify(model)}`;
}

function formProps(
  page: unknown,
  modelRef: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID]
) {
  return get(rowBinding(page, modelRef), "slots[0].props");
}

describe("the logged-out steps (legacy resetPassword, verify, verifyEmail, registerOrg)", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("gives every one of the seven positions a page of its own, with no package stub", () => {
    const pages = authPages();
    for (const key of [
      PAGE_KEY.AUTH_RESET_PASSWORD,
      PAGE_KEY.AUTH_VERIFY,
      PAGE_KEY.AUTH_VERIFY_SET_PASSWORD,
      PAGE_KEY.AUTH_VERIFY_EXPIRED,
      PAGE_KEY.AUTH_VERIFY_EMAIL,
      PAGE_KEY.AUTH_VERIFY_EMAIL_EXPIRED,
      PAGE_KEY.AUTH_REGISTER_ORG
    ]) {
      expect(includes(stringsIn(pages[key]), PACKAGE_STUB_TITLE), key).toBe(
        false
      );
    }
    const reset = formProps(
      pages[PAGE_KEY.AUTH_RESET_PASSWORD],
      DATA_REF_ID.RESET_PASSWORD_FORM_MODEL
    );
    expect(get(reset, "submit")).toBe(MOCK_ACTION.RESET_PASSWORD);
    expect(get(reset, "submitLabel")).toBe("Change password");
    expect(boundRefId(reset, "schema")).toBe(
      DATA_REF_ID.RESET_PASSWORD_FORM_SCHEMA
    );
    const setPassword = formProps(
      pages[PAGE_KEY.AUTH_VERIFY_SET_PASSWORD],
      DATA_REF_ID.SET_PASSWORD_FORM_MODEL
    );
    expect(get(setPassword, "submit")).toBe(MOCK_ACTION.VERIFY_SET_PASSWORD);
    const org = formProps(
      pages[PAGE_KEY.AUTH_REGISTER_ORG],
      DATA_REF_ID.REGISTER_ORG_FORM_MODEL
    );
    expect(get(org, "submit")).toBe(MOCK_ACTION.REGISTER_ORG);
    expect(get(org, "submitLabel")).toBe("Complete registration");
  });

  it("says what each outcome said, and points every dead end at a door", () => {
    const pages = authPages();
    expect(get(pages[PAGE_KEY.AUTH_VERIFY], "description")).toBe(
      "Account activation was successful."
    );
    expect(get(pages[PAGE_KEY.AUTH_VERIFY_EMAIL], "description")).toBe(
      "Thanks, your email has been verified."
    );
    const expired = stringsIn(pages[PAGE_KEY.AUTH_VERIFY_EXPIRED]);
    expect(expired).toContain("navigate:/login");
    expect(expired).toContain("navigate:/forgotten-password");
    expect(pages[PAGE_KEY.AUTH_VERIFY_EMAIL_EXPIRED]).toBe(
      pages[PAGE_KEY.AUTH_VERIFY_EXPIRED]
    );
    expect(stringsIn(pages[PAGE_KEY.AUTH_REGISTER_ORG])).toContain(
      "Login here"
    );
  });

  it("asks the reset link for the code only while two-factor is on", () => {
    expect(useResetPasswordSchema(false).required).toEqual(["password"]);
    expect(useResetPasswordSchema(true).required).toEqual([
      "password",
      "token"
    ]);
    const data = hostgrid();
    expect(
      get(
        resolveDataRef(dataRef(DATA_REF_ID.RESET_PASSWORD_FORM_SCHEMA), data),
        "required"
      )
    ).toEqual(["password"]);
    assign(data.security, { twoFactorEnabled: true });
    expect(
      get(
        resolveDataRef(dataRef(DATA_REF_ID.RESET_PASSWORD_FORM_SCHEMA), data),
        "required"
      )
    ).toEqual(["password", "token"]);
    // The verification link's first password never asks for one.
    expect(
      get(
        resolveDataRef(dataRef(DATA_REF_ID.SET_PASSWORD_FORM_SCHEMA), data),
        "required"
      )
    ).toEqual(["password"]);
  });

  it("lands the new password from the reset link and returns to sign in", () => {
    const data = hostgrid();
    const result = dispatchMockAction(
      data,
      {},
      formValue(MOCK_ACTION.RESET_PASSWORD, { password: NEW_PASSWORD })
    );
    expect(result).toMatchObject({
      formDone: true,
      to: "/login",
      toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title: "Password changed." }
    });
    expect(data.persona.password).toBe(NEW_PASSWORD);
  });

  it("refuses a reset with two-factor on and no six-digit code, and takes it with one", () => {
    const data = hostgrid();
    assign(data.security, { twoFactorEnabled: true });
    const refused = dispatchMockAction(
      data,
      {},
      formValue(MOCK_ACTION.RESET_PASSWORD, {
        password: NEW_PASSWORD,
        token: "12"
      })
    );
    expect(stringsIn(refused)).toContain(
      MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.INVALID_TWO_FACTOR_CODE]
    );
    expect(data.persona.password).not.toBe(NEW_PASSWORD);
    const taken = dispatchMockAction(
      data,
      {},
      formValue(MOCK_ACTION.RESET_PASSWORD, {
        password: NEW_PASSWORD,
        token: "123456"
      })
    );
    expect(get(taken, "to")).toBe("/login");
    expect(data.persona.password).toBe(NEW_PASSWORD);
  });

  it("activates the account on its first password", () => {
    const data = hostgrid();
    const result = dispatchMockAction(
      data,
      {},
      formValue(MOCK_ACTION.VERIFY_SET_PASSWORD, { password: NEW_PASSWORD })
    );
    expect(result).toMatchObject({
      formDone: true,
      to: "/login",
      toast: { title: "Account activation was successful." }
    });
    expect(data.persona.password).toBe(NEW_PASSWORD);
  });

  it("registers an organisation with legacy's fields and answers as legacy did", () => {
    const schema = useRegisterOrgSchema();
    expect(schema.required).toEqual([
      "orgName",
      "name",
      "email",
      "password",
      "currency"
    ]);
    expect(map(get(schema, "properties.currency.oneOf"), "const")).toEqual([
      ...PORTAL_FORM_CURRENCIES
    ]);
    expect(get(schema, "properties.importDemoData.type")).toBe("boolean");

    const result = dispatchMockAction(
      hostgrid(),
      {},
      formValue(MOCK_ACTION.REGISTER_ORG, {
        orgName: "Fieldnotes Studio",
        name: "Jonah Reyes",
        email: "jonah@fieldnotes.app",
        password: NEW_PASSWORD,
        currency: PORTAL_FORM_CURRENCIES[0],
        importDemoData: true
      })
    );
    expect(result).toMatchObject({
      formDone: true,
      to: "/login",
      toast: {
        intent: MOCK_TOAST_INTENT.SUCCESS,
        title: "Registration successful!"
      }
    });
  });
});
