// -----------------------------------------------------------------------------
/**
 * @module portal/config/auth-pages
 * @description The logged-out pages this app composes.
 */

import { ROW_LAYOUT } from "../content/types";
import { MOCK_ACTION, mockActionValue } from "../mock/actions";
import { DATA_REF_ID, dataRef } from "../mock/data-refs";
import { BUTTON_MODULE_VARIANT } from "../modules/button/types";
import { PROSE_MODULE_VARIANT } from "../modules/prose/types";
import {
  BUTTON_MODULE_ID,
  FORM_MODULE_ID,
  PROSE_MODULE_ID,
  moduleRef
} from "../registry";
import { PAGE_KEY } from "../types";
import type { ContentRowConfig } from "../content/types";
import type { DataRef } from "../mock/data-refs";
import type { ContentConfig, PageKey } from "../types";
// -----------------------------------------------------------------------------

const CLEAR_LABEL = "Clear";

function formRow(options: {
  readonly schema: DataRef;
  readonly uischema: DataRef;
  readonly model: DataRef;
  readonly submit: string | DataRef;
  readonly submitLabel: string;
  readonly visible?: DataRef;
}): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    visible: options.visible,
    slots: [
      moduleRef(FORM_MODULE_ID, {
        props: {
          schema: options.schema,
          uischema: options.uischema,
          model: options.model,
          submit: options.submit,
          submitLabel: options.submitLabel,
          resetLabel: CLEAR_LABEL
        }
      })
    ]
  };
}

function linkRow(options: {
  readonly label: string;
  readonly value: string | DataRef;
}): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    slots: [
      moduleRef(BUTTON_MODULE_ID, {
        variant: BUTTON_MODULE_VARIANT.SINGLE,
        props: {
          label: options.label,
          tone: "link",
          size: "sm",
          value: options.value
        }
      })
    ]
  };
}

function statementRow(
  markdown: DataRef | string,
  visible?: DataRef
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    visible,
    slots: [
      moduleRef(PROSE_MODULE_ID, {
        variant: PROSE_MODULE_VARIANT.MARKDOWN,
        props: {
          markdown,
          showMoreLabel: "Show more",
          showLessLabel: "Show less",
          emptyTitle: "Nothing to show"
        }
      })
    ]
  };
}

export function authPages(): Partial<Record<PageKey, ContentConfig>> {
  const page = (
    title: string,
    description: string,
    rows: readonly ContentRowConfig[]
  ): ContentConfig => ({ title, description, rows, footer: false });

  // The logged-out screens no package component serves, mocked as legacy
  // drew them (`views/client/auth/{resetPassword,verify,verifyEmail,registerOrg}`).
  const signIn = linkRow({
    label: "Sign in",
    value: mockActionValue(MOCK_ACTION.NAVIGATE, "/login")
  });
  // Legacy's `resetPasswordForm`: the new password, with the second-step code
  // where two-factor is on; "Change password" lands it and returns to sign in.
  const reset = page(
    "Reset password",
    "Choose a new password for your account.",
    [
      formRow({
        schema: dataRef(DATA_REF_ID.RESET_PASSWORD_FORM_SCHEMA),
        uischema: dataRef(DATA_REF_ID.RESET_PASSWORD_FORM_UISCHEMA),
        model: dataRef(DATA_REF_ID.RESET_PASSWORD_FORM_MODEL),
        submit: MOCK_ACTION.RESET_PASSWORD,
        submitLabel: "Change password"
      }),
      signIn
    ]
  );
  // Legacy's verify view, one screen per outcome: activated, or still
  // wanting its first password. Expired is the shared dead end below.
  const verified = page(
    "Account verification",
    "Account activation was successful.",
    [signIn]
  );
  const setPassword = page(
    "Set account password",
    "Choose the password you will sign in with.",
    [
      formRow({
        schema: dataRef(DATA_REF_ID.SET_PASSWORD_FORM_SCHEMA),
        uischema: dataRef(DATA_REF_ID.SET_PASSWORD_FORM_UISCHEMA),
        model: dataRef(DATA_REF_ID.SET_PASSWORD_FORM_MODEL),
        submit: MOCK_ACTION.VERIFY_SET_PASSWORD,
        submitLabel: "Continue"
      })
    ]
  );
  const verifiedEmail = page(
    "Email verification",
    "Thanks, your email has been verified.",
    [signIn]
  );
  // Every token link's past-using position — legacy's
  // `verify_link_expired_or_invalid` and `password_reset_link_expired` arms,
  // which each pointed at one door; this page keeps both.
  const expired = page(
    "This link has expired",
    "Links like this one work once, and for a while. This one is past using.",
    [
      statementRow(
        "Sign in again, or request a new link if you were resetting your password."
      ),
      signIn,
      linkRow({
        label: "Request a new link",
        value: mockActionValue(MOCK_ACTION.NAVIGATE, "/forgotten-password")
      })
    ]
  );
  // Legacy's `orgRegistrationForm` under "Get started for free".
  const registerOrg = page(
    "Get started for free",
    "Register your organisation.",
    [
      statementRow("Already have an account?"),
      linkRow({
        label: "Login here",
        value: mockActionValue(MOCK_ACTION.NAVIGATE, "/login")
      }),
      formRow({
        schema: dataRef(DATA_REF_ID.REGISTER_ORG_FORM_SCHEMA),
        uischema: dataRef(DATA_REF_ID.REGISTER_ORG_FORM_UISCHEMA),
        model: dataRef(DATA_REF_ID.REGISTER_ORG_FORM_MODEL),
        submit: MOCK_ACTION.REGISTER_ORG,
        submitLabel: "Complete registration"
      })
    ]
  );

  return {
    [PAGE_KEY.AUTH_REGISTER_ORG]: registerOrg,
    [PAGE_KEY.AUTH_RESET_PASSWORD]: reset,
    [PAGE_KEY.AUTH_VERIFY]: verified,
    [PAGE_KEY.AUTH_VERIFY_SET_PASSWORD]: setPassword,
    [PAGE_KEY.AUTH_VERIFY_EXPIRED]: expired,
    [PAGE_KEY.AUTH_VERIFY_EMAIL]: verifiedEmail,
    [PAGE_KEY.AUTH_VERIFY_EMAIL_EXPIRED]: expired,
    [PAGE_KEY.AUTH_PREFERENCES]: page(
      "Notification preferences",
      "Choose what we send you, and where it arrives.",
      [
        formRow({
          schema: dataRef(DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_SCHEMA),
          uischema: dataRef(DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_UISCHEMA),
          model: dataRef(DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL),
          submit: MOCK_ACTION.PREFERENCES_SAVE,
          submitLabel: "Save preferences"
        })
      ]
    ),
    // Legacy's `auth/emailOptIns`: one address, and the topics it receives.
    [PAGE_KEY.AUTH_EMAIL_OPT_INS]: page(
      "Email preferences",
      "What we send to this address, and nothing else.",
      [
        statementRow(dataRef(DATA_REF_ID.EMAIL_OPT_INS_INTRO)),
        formRow({
          schema: dataRef(DATA_REF_ID.EMAIL_OPT_INS_FORM_SCHEMA),
          uischema: dataRef(DATA_REF_ID.EMAIL_OPT_INS_FORM_UISCHEMA),
          model: dataRef(DATA_REF_ID.EMAIL_OPT_INS_FORM_MODEL),
          submit: dataRef(DATA_REF_ID.EMAIL_OPT_INS_FORM_SUBMIT),
          submitLabel: "Save preferences",
          // A brand that publishes no topics has nothing to subscribe to —
          // legacy showed a no-results panel rather than an empty form.
          visible: dataRef(DATA_REF_ID.HAS_EMAIL_TOPICS)
        }),
        linkRow({
          label: "Back to sign in",
          value: mockActionValue(MOCK_ACTION.NAVIGATE, "/login")
        })
      ]
    )
  };
}
