// -----------------------------------------------------------------------------
/**
 * @module portal/config/auth-pages
 * @description The logged-out pages. Sign-in, registration, recovery and
 * verification are `client-vue`'s session module, so each of those routes is a
 * stub (see `./client-vue`); the two token-addressed preference pages have no
 * client-vue counterpart and are composed here.
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
import { clientVuePage } from "./client-vue";
import type { ContentRowConfig } from "../content/types";
import type { DataRef } from "../mock/data-refs";
import type { ContentConfig, PageKey } from "../types";

const CLEAR_LABEL = "Clear";

const SESSION_MODULE = "auth";

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

function statementRow(markdown: DataRef, visible?: DataRef): ContentRowConfig {
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

  const login = clientVuePage(
    "Sign in",
    "Your products, invoices and tickets in one place.",
    "UpmSessionLogin",
    SESSION_MODULE
  );
  const register = clientVuePage(
    "Create your account",
    "One account for every product and invoice.",
    "UpmSessionRegister",
    SESSION_MODULE
  );
  const recover = clientVuePage(
    "Forgotten password",
    "We will email you a link to choose a new one.",
    "UpmSessionRecoverPassword",
    SESSION_MODULE
  );
  // Reset-with-token, verification and org registration have no client-vue
  // component yet; they ride the same headless module when one is added.
  const reset = clientVuePage(
    "Choose a new password",
    "Your reset link brought you here.",
    "UpmSessionRecoverPassword (reset step, to be added)",
    SESSION_MODULE
  );
  const verify = clientVuePage(
    "Verify your account",
    "The link in your email finishes here.",
    "UpmSessionVerify (to be added)",
    "auth · useVerifyEmail"
  );
  const registerOrg = clientVuePage(
    "Register your organisation",
    "An account for the whole team.",
    "UpmSessionRegister (organisation variant, to be added)",
    SESSION_MODULE
  );

  return {
    [PAGE_KEY.AUTH_LOGIN]: login,
    [PAGE_KEY.AUTH_LOGIN_TWOFA]: login,
    [PAGE_KEY.AUTH_REGISTER]: register,
    [PAGE_KEY.AUTH_REGISTER_ORG]: registerOrg,
    [PAGE_KEY.AUTH_FORGOTTEN_PASSWORD]: recover,
    [PAGE_KEY.AUTH_RESET_PASSWORD]: reset,
    [PAGE_KEY.AUTH_VERIFY]: verify,
    [PAGE_KEY.AUTH_VERIFY_SET_PASSWORD]: verify,
    [PAGE_KEY.AUTH_VERIFY_EXPIRED]: verify,
    [PAGE_KEY.AUTH_VERIFY_EMAIL]: verify,
    [PAGE_KEY.AUTH_VERIFY_EMAIL_EXPIRED]: verify,
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
