// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-account.schemas
 * @description Schema/uischema for the two forms that act on the ACCOUNT the
 * client is signed in as rather than on anything it owns (plan F4) — which of
 * their accounts is in play, and the picture that account wears. Written in
 * the headless shape, so `/scoped-composable-factory` consumes this file
 * unchanged alongside whatever four-layer contract the account module lands
 * with.
 *
 * The switcher offers the accounts this sign-in may act for and nothing else:
 * an account is an identity, so there is no free-text way to name one.
 *
 * The four-layer contract these two forms belong to is `client-account.ts`
 * beside this file; `account.schemas.ts` is the STAND-IN for the same real
 * module's verify-email parsers, which is why the account domain reads across
 * three files rather than one.
 *
 * @module-oracle vue-app `tenancy/selectAccountModal.vue`,
 * `selectAccountList.vue`, and the profile card's `@avatar-changed`.
 */

import { compact, map } from "lodash-es";
import type { ClientAccount, SwitchAccountContext } from "./client-account";
import type { JsonSchema7, VerticalLayout } from "@jsonforms/core";
import type { FormModel } from "@upmind/ui";

/** One pick-list choice as the UI renderers read it — not a core schema keyword. */
type SchemaChoice = { label: string; value: string };

type SchemaProperty = JsonSchema7 & { options?: SchemaChoice[] };

/** An account reads as itself and the brand it belongs to — legacy printed both. */
function accountChoices(accounts: readonly ClientAccount[]): SchemaChoice[] {
  return map(accounts, account => ({
    label: compact([account.name, account.brandName]).join(" · "),
    value: account.id
  }));
}

/** Schema for the switch-account form. */
export const useSwitchAccountSchema = (
  context: SwitchAccountContext
): JsonSchema7 => {
  const accountId: SchemaProperty = {
    type: "string",
    title: "Account",
    enum: map(context.accounts, "id"),
    options: accountChoices(context.accounts)
  };
  return {
    type: "object",
    title: "Switch account",
    required: ["accountId"],
    properties: { accountId }
  };
};

/** UI schema for the switch-account form. */
export const useSwitchAccountUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/accountId",
      i18n: "form.account",
      options: { format: "radio", noLabel: true }
    }
  ]
});

/** What the switcher opens on — the account already in play. */
export const switchAccountDefaults = (
  context: SwitchAccountContext
): FormModel => ({
  accountId: context.activeAccountId ?? context.accounts[0]?.id ?? ""
});

// --- the account's picture ----------------------------------------------------

/** Schema for the avatar form — an address the browser can load a picture from. */
export const useAvatarSchema = (): JsonSchema7 => ({
  type: "object",
  title: "Photo",
  required: ["avatarSrc"],
  properties: {
    avatarSrc: {
      type: "string",
      title: "Image address",
      format: "uri"
    }
  },
  errorMessage: {
    properties: {
      avatarSrc: "Enter the web address of an image."
    }
  }
});

/** UI schema for the avatar form. */
export const useAvatarUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/avatarSrc",
      i18n: "form.avatar",
      options: {
        autoFocus: true,
        placeholder: "https://example.com/your-photo.jpg"
      }
    }
  ]
});

/** What the avatar dialog opens on — the picture on file, or nothing. */
export const avatarDefaults = (current: string | undefined): FormModel => ({
  avatarSrc: current ?? ""
});
