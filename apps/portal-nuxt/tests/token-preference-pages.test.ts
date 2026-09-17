// -----------------------------------------------------------------------------
/**
 * @module tests/token-preference-pages
 * @description Plan F5 O2 — legacy's `auth/preferences` and
 * `auth/emailOptIns`: the two screens a client reaches from a link in an
 * email, with no session behind them. The link IS the state, so the token and
 * the address are driven through the page rather than described; and the
 * screen renders the account page's own preference form, so the form phase's
 * promise ("same schema, only the answerer changes") is graded as identity
 * rather than resemblance.
 *
 * Legacy derives `receive_emails` from the topics server-side
 * (`manageEmailTopicOptInsModal.vue`), so the topics ARE the control: the
 * derived flag is graded on both sides of its own hinge.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotificationChannelCodes } from "@upmind-automation/types";
import {
  clearPageGlobals,
  hostedAt,
  stubPageGlobals
} from "./support/logged-out-host";
import { boundRefId, propsBinding, rowBinding } from "./support/page-config";
import { every, filter, find, keys, map, size, some, values } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockEmail } from "~/portal/mock/types";
import { usePortalConfig } from "~/composables/usePortalConfig";
import optInsSource from "~/pages/preferences/email/opt-ins.vue?raw";
import preferencesSource from "~/pages/preferences/index.vue?raw";
import { accountPages } from "~/portal/config/account-pages";
import { authPages } from "~/portal/config/auth-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY, RESERVED_PILLAR_SEGMENT } from "~/portal/types";

// The app draws these two screens itself, so they take the chrome-drawing
// layout. The auth screens take the bare `logged-out` one, whose page comes
// from the package's template slot instead.
const LOGGED_OUT_LAYOUT = 'definePageMeta({ layout: "logged-out-page" })';

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.token-from-the-link";

const FORM_BINDINGS = ["schema", "uischema", "model"];

/** The route tails under `preferences` — neither is a reservable head. */
const NESTED_TAILS = ["email", "opt-ins"];

const PAGE_FILE = {
  preferences: () => import("~/pages/preferences/index.vue"),
  optIns: () => import("~/pages/preferences/email/opt-ins.vue")
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function preferencesPage(): unknown {
  return authPages()[PAGE_KEY.AUTH_PREFERENCES];
}

function optInsPage(): unknown {
  return authPages()[PAGE_KEY.AUTH_EMAIL_OPT_INS];
}

function accountPreferencesPage(): unknown {
  return accountPages()[PAGE_KEY.ACCOUNT_NOTIFICATIONS];
}

function seededEmail(data: MockDataset, subscribed: boolean): MockEmail {
  const entry = find(
    data.emails,
    candidate => size(candidate.topicOptIns) > 0 === subscribed
  );
  if (entry === undefined) {
    throw new Error(
      `the seed carries no address ${subscribed ? "with" : "without"} opt-ins`
    );
  }
  return entry;
}

function linkFor(email: MockEmail): DataRouteContext {
  return { email: email.email ?? "", token: TOKEN };
}

function mandatoryRows(data: MockDataset) {
  return filter(data.notificationPreferences, row => row.mandatory);
}

/** Every preference cell turned off — what clearing the matrix would send. */
function allOff(data: MockDataset): Record<string, boolean> {
  const model = ref<Record<string, boolean>>(
    data,
    DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL
  );
  return Object.fromEntries(map(keys(model), key => [key, false]));
}

beforeEach(() => {
  stubPageGlobals();
  resetMockData(MOCK_DATASET_ID.HOSTGRID);
  resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  usePortalConfig().setDataset(MOCK_DATASET_ID.HOSTGRID);
});

afterEach(() => {
  clearPageGlobals();
});

describe("the two screens a link opens", () => {
  it("are page files in the logged-out shell, under a segment the portal keeps", () => {
    expect(preferencesSource).toContain(LOGGED_OUT_LAYOUT);
    expect(optInsSource).toContain(LOGGED_OUT_LAYOUT);
    expect(RESERVED_PILLAR_SEGMENT.PREFERENCES).toBe("preferences");
    expect(preferencesPage()).toBeDefined();
    expect(optInsPage()).toBeDefined();
  });

  it("the nested opt-in route is its own page — logged-out shell, its own key", async () => {
    const address = seededEmail(hostgrid(), true).email ?? "";

    const hosted = await hostedAt(PAGE_FILE.optIns, {
      token: TOKEN,
      email: address
    });

    expect(optInsSource).toContain(LOGGED_OUT_LAYOUT);
    expect(hosted.pageKeys).toEqual([PAGE_KEY.AUTH_EMAIL_OPT_INS]);
    expect(optInsPage()).toBeDefined();
    // Only single heads are reservable, so the per-segment sweep in
    // `auth-pages` cannot reach either tail of this route.
    expect(values(RESERVED_PILLAR_SEGMENT)).toContain(
      RESERVED_PILLAR_SEGMENT.PREFERENCES
    );
    for (const tail of NESTED_TAILS) {
      expect(values<string>(RESERVED_PILLAR_SEGMENT), tail).not.toContain(tail);
    }
  });

  it("a preferences link with no token has nothing to act on, and says so", async () => {
    const bare = await hostedAt(PAGE_FILE.preferences);
    const carried = await hostedAt(PAGE_FILE.preferences, { token: TOKEN });

    expect(bare.pageKeys).toEqual([
      PAGE_KEY.AUTH_VERIFY_EXPIRED,
      PAGE_KEY.AUTH_PREFERENCES
    ]);
    expect(carried.pageKeys).toEqual([PAGE_KEY.AUTH_PREFERENCES]);
    expect(carried.routeContext).toEqual({ token: TOKEN });
  });

  it("an opt-in link short of either half lands on that same dead end", async () => {
    const address = seededEmail(hostgrid(), true).email ?? "";

    const bare = await hostedAt(PAGE_FILE.optIns);
    const halfWay = await hostedAt(PAGE_FILE.optIns, { token: TOKEN });
    const whole = await hostedAt(PAGE_FILE.optIns, {
      token: TOKEN,
      email: address
    });

    expect(bare.pageKeys).toEqual([
      PAGE_KEY.AUTH_VERIFY_EXPIRED,
      PAGE_KEY.AUTH_EMAIL_OPT_INS
    ]);
    expect(halfWay.pageKeys).toEqual([
      PAGE_KEY.AUTH_VERIFY_EXPIRED,
      PAGE_KEY.AUTH_EMAIL_OPT_INS
    ]);
    expect(whole.pageKeys).toEqual([PAGE_KEY.AUTH_EMAIL_OPT_INS]);
    expect(whole.routeContext).toEqual({ token: TOKEN, email: address });
  });
});

describe("the preference screen is the account page's own form", () => {
  it("binds the very same schema, uischema and model the signed-in page binds", () => {
    const fromLink = propsBinding(
      preferencesPage(),
      DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL
    );
    const fromAccount = propsBinding(
      accountPreferencesPage(),
      DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL
    );

    expect(fromLink).toBeDefined();
    expect(fromAccount).toBeDefined();
    for (const key of FORM_BINDINGS) {
      expect(boundRefId(fromLink, key), key).toBeDefined();
      expect(boundRefId(fromLink, key), key).toBe(boundRefId(fromAccount, key));
    }
    expect(fromLink?.submit).toBe(MOCK_ACTION.PREFERENCES_SAVE);
    expect(fromAccount?.submit).toBe(MOCK_ACTION.NOTIFICATION_PREFERENCES_SAVE);
  });

  it("asks one question per cell of the matrix the brand publishes", () => {
    const data = hostgrid();
    const schema = ref<{ properties?: Record<string, unknown> }>(
      data,
      DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_SCHEMA
    );
    const model = ref<Record<string, boolean>>(
      data,
      DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL
    );

    const cells = data.notificationPreferences.flatMap(row =>
      keys(row.channels)
    );
    expect(cells.length).toBeGreaterThan(0);
    expect(keys(model)).toHaveLength(cells.length);
    expect(keys(schema.properties ?? {})).toEqual(keys(model));
  });

  it("saving from the link writes exactly what saving from the account page writes", () => {
    const viaLink: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
    const viaAccount: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
    const cleared = allOff(viaLink);

    dispatchMockAction(
      viaLink,
      {},
      `${MOCK_ACTION.PREFERENCES_SAVE}:${JSON.stringify(cleared)}`
    );
    dispatchMockAction(
      viaAccount,
      {},
      `${MOCK_ACTION.NOTIFICATION_PREFERENCES_SAVE}:${JSON.stringify(cleared)}`
    );

    expect(viaLink.notificationPreferences).toEqual(
      viaAccount.notificationPreferences
    );
    expect(viaLink.notificationPreferences).not.toEqual(
      HOSTGRID_MOCK_DATASET.notificationPreferences
    );
  });

  it("the topics the brand insists on are not the client's to turn off", () => {
    const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
    const locked = structuredClone(mandatoryRows(data));
    expect(locked.length).toBeGreaterThan(0);

    const result = dispatchMockAction(
      data,
      {},
      `${MOCK_ACTION.PREFERENCES_SAVE}:${JSON.stringify(allOff(data))}`
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(mandatoryRows(data)).toEqual(locked);
  });
});

describe("the opt-in screen — one address, the topics it hears about", () => {
  it("offers one control per published topic, opened on that address's own answers", () => {
    const data = hostgrid();
    const subscribed = seededEmail(data, true);
    const silent = seededEmail(data, false);
    expect(data.emailTopics.length).toBeGreaterThan(0);

    const model = ref<Record<string, boolean>>(
      data,
      DATA_REF_ID.EMAIL_OPT_INS_FORM_MODEL,
      linkFor(subscribed)
    );
    const quiet = ref<Record<string, boolean>>(
      data,
      DATA_REF_ID.EMAIL_OPT_INS_FORM_MODEL,
      linkFor(silent)
    );

    // A topic the ACCOUNT turned off on the email channel reads off whatever
    // this address holds — it cannot opt back in on its own (plan F16 O-8).
    const accountReceives = (topicId: string) =>
      find(data.notificationPreferences, { topic: topicId })?.channels[
        NotificationChannelCodes.EMAIL
      ] !== false;

    expect(keys(model)).toEqual(map(data.emailTopics, "id"));
    expect(model).toEqual(
      Object.fromEntries(
        map(data.emailTopics, topic => [
          topic.id,
          subscribed.topicOptIns.includes(topic.id) && accountReceives(topic.id)
        ])
      )
    );
    expect(
      some(
        data.emailTopics,
        topic =>
          subscribed.topicOptIns.includes(topic.id) &&
          !accountReceives(topic.id)
      )
    ).toBe(true);
    expect(some(model, value => value)).toBe(true);
    expect(every(quiet, value => value === false)).toBe(true);
  });

  it("names the address the link is about, and addresses the save to it", () => {
    const data = hostgrid();
    const email = seededEmail(data, true);

    expect(
      ref<string>(data, DATA_REF_ID.EMAIL_OPT_INS_INTRO, linkFor(email))
    ).toContain(email.email ?? "");
    expect(
      ref<string>(data, DATA_REF_ID.EMAIL_OPT_INS_FORM_SUBMIT, linkFor(email))
    ).toBe(`${MOCK_ACTION.EMAIL_OPT_INS_SAVE}:${email.email}`);
  });

  it("an address the brand does not hold is refused, and no address moves", () => {
    const data: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
    const before = structuredClone(HOSTGRID_MOCK_DATASET).emails;

    const result = dispatchMockAction(
      data,
      {},
      `${MOCK_ACTION.EMAIL_OPT_INS_SAVE}:nobody@not-a-client.test:${JSON.stringify({ everything: true })}`
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.WARNING);
    expect(data.emails).toEqual(before);
  });

  it("a brand publishing no topics offers no form to fill in", () => {
    expect(minimal().emailTopics).toEqual([]);
    expect(ref(minimal(), DATA_REF_ID.HAS_EMAIL_TOPICS)).toBe(false);
    expect(ref(hostgrid(), DATA_REF_ID.HAS_EMAIL_TOPICS)).toBe(true);
    expect(
      boundRefId(
        rowBinding(optInsPage(), DATA_REF_ID.EMAIL_OPT_INS_FORM_MODEL),
        "visible"
      )
    ).toBe(DATA_REF_ID.HAS_EMAIL_TOPICS);
  });
});
