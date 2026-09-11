// -----------------------------------------------------------------------------
/**
 * @module tests/standin-schemas
 * @description Plan F3 as amended: every `mock/contracts/*.schemas.ts` is the
 * real headless file transcribed export for export, because the real one cannot
 * be imported — the barrel that reaches it module-load `interpret()`s the
 * routing machine. So the real file is graded as the ORACLE it is: its SOURCE is
 * transpiled and evaluated with the runtime values it imports stubbed, and the
 * stand-in — imported as it ships — must answer the same thing for the same
 * context. A divergence the stand-in's own header does not declare is a finding.
 */

import { RuleEffect } from "@jsonforms/core";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  BlueprintFieldsTypes,
  BrandConfigKeys,
  TwofaProviders
} from "@upmind-automation/types";
import accountRealSource from "../../../packages/headless/src/modules/account/account.schemas.ts?raw";
import loginRealSource from "../../../packages/headless/src/modules/auth/auth.schemas.login.ts?raw";
import recoverRealSource from "../../../packages/headless/src/modules/auth/auth.schemas.recover.ts?raw";
import twofaRealSource from "../../../packages/headless/src/modules/auth/auth.schemas.twofa.ts?raw";
import addressRealSource from "../../../packages/headless/src/modules/client-address/client-address.schemas.ts?raw";
import addressTypesSource from "../../../packages/headless/src/modules/client-address/client-address.types.ts?raw";
import companyRealSource from "../../../packages/headless/src/modules/client-company/client-company.schemas.ts?raw";
import emailRealSource from "../../../packages/headless/src/modules/client-email/client-email.schemas.ts?raw";
import personalDetailsRealSource from "../../../packages/headless/src/modules/client-personal-details/client-personal-details.schemas.ts?raw";
import phoneRealSource from "../../../packages/headless/src/modules/client-phone/client-phone.schemas.ts?raw";
import fieldParsersRealSource from "../../../packages/headless/src/utils/useFields.ts?raw";
import translationRealSource from "../../../packages/headless/src/utils/useTranslation.ts?raw";
import {
  assign,
  castArray,
  filter,
  forEach,
  get,
  includes,
  isEmpty,
  isString,
  keys,
  map,
  omit,
  omitBy,
  pick,
  pickBy,
  reduce,
  set,
  sortBy,
  uniq
} from "lodash-es";
import type { ProfileContext } from "@upmind-automation/headless";
import type { MockDataset } from "~/portal/mock/types";
import * as accountStandIn from "~/portal/mock/contracts/account.schemas";
import accountStandInSource from "~/portal/mock/contracts/account.schemas.ts?raw";
import * as twofaStandIn from "~/portal/mock/contracts/auth.schemas.twofa";
import * as customFieldsStandIn from "~/portal/mock/contracts/client-custom-fields.schemas";
import * as personalDetailsStandIn from "~/portal/mock/contracts/client-personal-details.schemas";
import { profileFormContext } from "~/portal/mock/forms/profile-context";
import { MOCK_DATASET_ID, useMockData } from "~/portal/mock/store";

type Transcribed = Record<string, (...args: readonly unknown[]) => unknown>;

/**
 * The one addition each stand-in with a real counterpart is allowed — named
 * for its own module now, so a barrel can re-export it without every
 * stand-in claiming the same word.
 */
const CREATE_MODEL_EXPORT = {
  email: "emailDefaults",
  phone: "phoneDefaults",
  address: "addressDefaults",
  company: "companyDefaults",
  twofa: "twoFactorDefaults",
  personalDetails: "profileDefaults",
  login: "loginDefaults",
  recover: "recoverDefaults",
  register: "registerDefaults",
  account: "verifyEmailDefaults",
  card: "paymentDetailsDefaults"
} as const;

const IMPORT_STATEMENT = /^import[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm;

const EXPORT_KEYWORD =
  /^export\s+(?=(?:const|function|class|let|var|type|interface|enum))/gm;

const EXPORTED_VALUE = /^export\s+(?:const|function)\s+(\w+)/gm;

const DECLARED_NAME = /^(?:const|function|class|let|var|enum)\s+(\w+)/gm;

const EXPORTED_NAME =
  /export\s+(?:declare\s+)?(?:const|function|class|enum)\s+(\w+)/g;

/**
 * The real file, run as data. Its imports are stripped and the values they bound
 * are handed in as `stubs`, so nothing in the headless closure is executed —
 * which is the whole reason the stand-ins exist.
 */
function evaluateHeadless(
  source: string,
  stubs: Record<string, unknown>
): Transcribed {
  const body = source.replace(IMPORT_STATEMENT, "");
  const exported = map([...body.matchAll(EXPORTED_VALUE)], match => match[1]);
  const script = body.replace(EXPORT_KEYWORD, "");
  const declared = map([...script.matchAll(DECLARED_NAME)], match => match[1]);
  const names = filter(Object.keys(stubs), name => !includes(declared, name));
  const compiled = ts.transpileModule(script, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext
    }
  }).outputText;

  return new Function(
    ...names,
    `${compiled}\nreturn { ${exported.join(", ")} };`
  )(...map(names, name => stubs[name]));
}

/** Every name a module's source exports, however it spells the declaration. */
function exportedNames(source: string): string[] {
  const found = source.matchAll(EXPORTED_NAME);
  return sortBy(uniq(map([...found], match => match[1] ?? "")));
}

function every(node: unknown, key: string, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    forEach(node, child => every(child, key, found));
    return found;
  }
  if (typeof node !== "object" || node === null) return found;
  forEach(Object.entries(node), ([name, value]) => {
    if (name === key && isString(value)) found.push(value);
    every(value, key, found);
  });
  return found;
}

/** The uischema with the named controls taken out, layouts and all else intact. */
function withoutScopes(node: unknown, scopes: readonly string[]): unknown {
  if (Array.isArray(node)) {
    return map(
      filter(node, child => !includes(scopes, get(child, "scope"))),
      child => withoutScopes(child, scopes)
    );
  }
  if (typeof node !== "object" || node === null) return node;
  return reduce(
    Object.entries(node),
    (result: Record<string, unknown>, [name, value]) => {
      result[name] = withoutScopes(value, scopes);
      return result;
    },
    {}
  );
}

// `xstate/lib/utils`' own `isArray` is `Array.isArray`; `useTranslateField` is
// evaluated from its own source rather than guessed at.
const TRANSLATION = evaluateHeadless(translationRealSource, { get });

const ADDRESS_TYPES = evaluateHeadless(addressTypesSource, {
  AccessRoleTypes: { CLIENT: "client" },
  ScopeActorTypes: {
    SELF: "self",
    STAFF: "staff",
    CLIENT: "client",
    GUEST: "guest"
  }
});

const STUBS = {
  assign,
  castArray,
  filter,
  forEach,
  get,
  includes,
  isArray: Array.isArray,
  isEmpty,
  isString,
  map,
  omit,
  omitBy,
  reduce,
  set,
  BlueprintFieldsTypes,
  BrandConfigKeys,
  RuleEffect,
  TwofaProviders,
  AddressTypes: ADDRESS_TYPES.AddressTypes,
  ADDRESS_TYPE_KEYS: ADDRESS_TYPES.ADDRESS_TYPE_KEYS,
  useTranslateField: TRANSLATION.useTranslateField
};

const realEmail = evaluateHeadless(emailRealSource, STUBS);
const realPhone = evaluateHeadless(phoneRealSource, STUBS);
const realTwofa = evaluateHeadless(twofaRealSource, STUBS);
const realAddress = evaluateHeadless(addressRealSource, STUBS);
const realFieldParsers = evaluateHeadless(fieldParsersRealSource, STUBS);
const realCompany = evaluateHeadless(companyRealSource, {
  ...STUBS,
  computed: (read: () => unknown) => ({ value: read() }),
  ScopeActorTypes: { SELF: "self", CLIENT: "client" },
  ClientAddressContextTypes: { ADDRESS: "address" },
  ClientEmailContextTypes: { EMAIL: "email" },
  useClientAddresses: () => ({}),
  useClientAddressManager: () => ({}),
  useClientEmails: () => ({}),
  useClientEmailManager: () => ({}),
  useClientPhones: () => ({}),
  useClientPhoneManager: () => ({}),
  useSchemaDefinitions: realAddress.useSchemaDefinitions,
  useUischemaDefinitions: realAddress.useUischemaDefinitions,
  useAddressSchema: realAddress.useSchemaDefinitions,
  useAddressUischema: realAddress.useUischemaDefinitions
});

/**
 * The card module's oracle. Only the ADD branch is reachable with the
 * stand-in's narrowed context, which is the whole of what it transcribes; the
 * PAY branch's own imports (`generateResponseUrls`, `useI18n`) are stubbed so
 * evaluating the file cannot reach them.
 */

/**
 * The profile schema's own custom-field contract is the barrel import the
 * stand-in exists to avoid, so the oracle gets the SHARED parsers the
 * `client-custom-fields` block above already grades the stand-in against.
 */
const realPersonalDetails = evaluateHeadless(personalDetailsRealSource, {
  ...STUBS,
  pick,
  pickBy,
  useCustomFieldsSchema: realFieldParsers.useFieldsSchemaParser,
  useCustomFieldsUischema: realFieldParsers.useFieldsUischemaParser
});

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

describe("stand-in schema modules — the real file, field for field", () => {
  it("the oracle files ran — an empty sandbox would grade nothing at all", () => {
    expect(sortBy(Object.keys(realEmail))).toEqual(
      exportedNames(emailRealSource)
    );
    expect(sortBy(Object.keys(realPhone))).toEqual(
      exportedNames(phoneRealSource)
    );
    expect(sortBy(Object.keys(realTwofa))).toEqual(
      exportedNames(twofaRealSource)
    );
    expect(sortBy(Object.keys(realAddress))).toEqual(
      exportedNames(addressRealSource)
    );
    expect(sortBy(Object.keys(realCompany))).toEqual(
      exportedNames(companyRealSource)
    );
    expect(sortBy(Object.keys(realFieldParsers))).toEqual(
      exportedNames(fieldParsersRealSource)
    );
    expect(get(realEmail.useSchema(), "required")).toEqual(["email"]);
    expect(ADDRESS_TYPES.AddressTypes).toHaveLength(4);
  });

  it("auth two-factor keeps the six-digit pattern and its message", () => {
    expect(twofaStandIn.useTwoFASchema()).toEqual(realTwofa.useTwoFASchema());
    expect(twofaStandIn.useTwoFAUischema()).toEqual(
      realTwofa.useTwoFAUischema()
    );
    for (const provider of Object.values(TwofaProviders)) {
      expect(twofaStandIn.useTwoFAUischema(provider)).toEqual(
        realTwofa.useTwoFAUischema(provider)
      );
    }
  });

  it("client-custom-fields parses a field set the way the shared parsers do", () => {
    const definitions = [...hostgrid().customFields];

    expect(definitions.length).toBeGreaterThan(1);
    expect(customFieldsStandIn.useCustomFieldsSchema(definitions)).toEqual(
      realFieldParsers.useFieldsSchemaParser(definitions)
    );
    expect(customFieldsStandIn.useCustomFieldsUischema(definitions)).toEqual(
      realFieldParsers.useFieldsUischemaParser(definitions)
    );
    expect(customFieldsStandIn.useCustomFieldsModel(definitions, {})).toEqual(
      realFieldParsers.useFieldsModelParser(definitions, {})
    );
    expect(customFieldsStandIn.useCustomFieldsSchema([])).toEqual(
      realFieldParsers.useFieldsSchemaParser([])
    );
    expect(customFieldsStandIn.useCustomFieldsUischema([])).toEqual(
      realFieldParsers.useFieldsUischemaParser([])
    );
  });
});

describe("client-personal-details — the one declared divergence, and nothing else", () => {
  /** The real file keeps `customFields` only where the filter lets one through. */
  function unfilteredContext(data: MockDataset): ProfileContext {
    const context = profileFormContext(data);
    return assign({}, context, {
      lookups: assign({}, context.lookups, {
        fields: [...data.customFields],
        filterFields: []
      })
    });
  }

  it("answers exactly what the real module answers for the profile form's context", () => {
    const context = profileFormContext(hostgrid());

    expect(context.lookups?.filterFields).toHaveLength(4);
    expect(Object.keys(context.model ?? {})).toHaveLength(4);
    expect(personalDetailsStandIn.useSchema(context)).toEqual(
      realPersonalDetails.useSchema(context)
    );
    expect(personalDetailsStandIn.useUischema(context)).toEqual(
      realPersonalDetails.useUischema(context)
    );
  });

  it("diverges only in the customFields sub-schema the barrel would drag in", () => {
    const context = unfilteredContext(hostgrid());
    const real = realPersonalDetails.useSchema(context);
    const standIn = personalDetailsStandIn.useSchema(context);

    expect(get(real, "properties.customFields")).toBeDefined();
    expect(get(standIn, "properties.customFields")).toBeUndefined();
    expect(standIn).toEqual(omit(real, ["properties.customFields"]));
  });

  it("drops the custom-field controls from the layout and nothing else", () => {
    const data = hostgrid();
    const context = unfilteredContext(data);
    const customScopes = every(
      realFieldParsers.useFieldsUischemaParser([...data.customFields]),
      "scope"
    );
    const real = realPersonalDetails.useUischema(context);
    const standIn = personalDetailsStandIn.useUischema(context);

    expect(customScopes.length).toBeGreaterThan(1);
    expect(sortBy(every(real, "scope"))).toEqual(
      sortBy([...every(standIn, "scope"), ...customScopes])
    );
    expect(standIn).toEqual(withoutScopes(real, customScopes));
  });
});

/** Everything a stand-in says about itself, before its first import. */
function declaredHeader(source: string): string {
  return source.slice(0, source.indexOf("*/"));
}

const realLogin = evaluateHeadless(loginRealSource, {});

const realRecover = evaluateHeadless(recoverRealSource, {});

const realAccount = evaluateHeadless(accountRealSource, {});

describe("auth login and recover — the real file, and one addition", () => {
  it("the oracles ran — an empty sandbox would grade nothing at all", () => {
    expect(sortBy(Object.keys(realLogin))).toEqual(
      exportedNames(loginRealSource)
    );
    expect(sortBy(Object.keys(realRecover))).toEqual(
      exportedNames(recoverRealSource)
    );
    expect(get(realLogin.useLoginSchema(), "required")).toEqual([
      "username",
      "password"
    ]);
    expect(get(realRecover.useRecoverSchema(), "required")).toEqual([
      "username"
    ]);
  });
});

describe("account.schemas — the real parsers, spelled this app's way", () => {
  const OPTIONS = { loading: true, success: false };

  it("answers exactly what the real module answers, parser for parser", () => {
    expect(accountStandIn.useVerifyEmailSchemaParser()).toEqual(
      realAccount.useVerifyEmailSchemaParser()
    );
    expect(accountStandIn.useVerifyEmailUischemaParser()).toEqual(
      realAccount.useVerifyEmailUischemaParser()
    );
    expect(accountStandIn.useGuestEmailSchemaParser()).toEqual(
      realAccount.useGuestEmailSchemaParser()
    );
    expect(accountStandIn.useGuestEmailModelParser()).toEqual(
      realAccount.useGuestEmailModelParser()
    );
    expect(
      accountStandIn.useGuestEmailModelParser({ email: "ada@example.com" })
    ).toEqual(
      realAccount.useGuestEmailModelParser({ email: "ada@example.com" })
    );
  });

  it("the guest-email uischema merges its caller's options the same way", () => {
    expect(accountStandIn.useGuestEmailUischemaParser()).toEqual(
      realAccount.useGuestEmailUischemaParser()
    );
    expect(accountStandIn.useGuestEmailUischemaParser(OPTIONS)).toEqual(
      realAccount.useGuestEmailUischemaParser(OPTIONS)
    );
    expect(
      get(
        accountStandIn.useGuestEmailUischemaParser(OPTIONS),
        "elements[0].options.loading"
      )
    ).toBe(true);
  });

  it("the header declares both mechanical divergences, and the addition", () => {
    const header = declaredHeader(accountStandInSource);

    expect(header).toContain(
      "packages/headless/src/modules/account/account.schemas.ts"
    );
    expect(header).toMatch(/two declared divergences/i);
    expect(header).toContain("JsonSchema7");
    expect(header).toContain("assign");
    expect(header).toContain(CREATE_MODEL_EXPORT.account);
  });

  it("the create model opens the one control the verify form binds", () => {
    expect(sortBy(keys(accountStandIn.verifyEmailDefaults()))).toEqual(
      sortBy(keys(get(realAccount.useVerifyEmailSchemaParser(), "properties")))
    );
    expect(accountStandIn.verifyEmailDefaults()).toEqual({ code: "" });
  });
});
