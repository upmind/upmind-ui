// -----------------------------------------------------------------------------
/**
 * @module auth/__tests__/auth.steps
 * @description The module's ONE step catalog: what drives the colocated
 * `auth.feature`. Engine-free: it imports `defineSteps` and `World` and nothing
 * else, and speaks to the landing through the `World` members only.
 *
 * `World` reads no request. A step that names a wire fact is graded through
 * the state the wire decides, and each step below binds to the state that can
 * go red for the defect its text names:
 * - the new client session: `sessionId` equals the `actor_id` of the recorded
 *   grant;
 * - the API error: the published `error.status` equals the status of the
 *   recorded refusal the Given armed;
 * - no request: no verify answer was ever published (`twoFAProvider` is null);
 *   a request that went out and was refused also leaves it null, so the
 *   invalid-link step (the landing's own 400, not the recorded 409) is what
 *   turns that scenario red.
 *
 * Three facts have no World-visible state: which bearer authorised the link
 * check (the replay never matches on `Authorization`, and the staff-session
 * Given seeds nothing), a route change, and the analytics ids in the grant
 * body. Those steps keep the planner's text and grade the outcome the landing
 * publishes (link check succeeded, success at rest, activated). Their
 * read-backs are the `AC-1` (staff-bearer), `AC-17` and `AC-11` cases of
 * `auth.verify-registration.guest.int.test.ts`.
 *
 * Several Givens arrange nothing ("my account already has a password", "the
 * API refuses my link", "the brand has an analytics id", ...): the recording
 * the World serves decides those states, not the Given.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import refusedLinkRecording from "./fixtures/patch-clients-reg-hash-verify-case-invalid-hash.json";
import directGrantRecording from "./fixtures/post-oauth-access-token-case-complete-direct-client.json";
import refusedGrantRecording from "./fixtures/post-oauth-access-token-case-complete-refused.json";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The scenario key the landing boots under; the consuming playground's own. */
export const VERIFY_REGISTRATION_SCENARIO = "verify_registration";

export const VERIFY_REGISTRATION_COVERED_ACTIONS = {
  completeRegistration: "completeRegistration",
  destroy: "destroy",
  isReady: "isReady",
  reset: "reset",
  set: "set",
  verify: "verify"
} as const;

export const coveredActionIds: readonly string[] = Object.values(
  VERIFY_REGISTRATION_COVERED_ACTIONS
);

const ACTIONS = VERIFY_REGISTRATION_COVERED_ACTIONS;

/** Status 400 is the landing's own refusal; an API refusal keeps its own status. */
const INVALID_LINK_STATUS = 400;

const LINK_USERNAME = "link-user@example.com";
const LINK_HASH = "link-hash-value";
const EXPIRED_IN_2020 = "2020-01-01T10:00:00Z";
const VALID_PASSWORD = "abcdefg1";

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

type Link = {
  username?: string;
  hash?: string;
  expires?: string;
  redirect?: string;
};

/** The link values the next "checks my link" step sends; reset by the Background. */
let link: Link = {};

/** The recorded refusal status the API refusal Given armed; reset by the Background. */
let refusedStatus: number | undefined;

/** The session id the recorded direct grant names, read off its recording. */
const GRANTED_SESSION_ID = directGrantRecording.response.body.actor_id;

/** Re-runs a world expectation until the landing settles on it. */
async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
  }
  return assertion();
}

const boot = (world: World): Promise<void> =>
  world.boot(VERIFY_REGISTRATION_SCENARIO, { actor: SCOPE_ACTOR.SELF });

const settledAt = (world: World, state: string): Promise<void> =>
  settles(() => world.expectContext!({ currentState: state }));

/** Starts the landing with the link values the Givens collected. */
async function checkLink(world: World): Promise<void> {
  await world.fire(ACTIONS.verify, link);
  await world.fire(ACTIONS.isReady);
}

async function submitPassword(
  world: World,
  password: string,
  confirmation: string
): Promise<void> {
  await world.fire(ACTIONS.set, {
    password,
    password_confirmation: confirmation
  });
  await world.fire(ACTIONS.completeRegistration);
}

const activated = (world: World): Promise<void> =>
  settles(() => world.expectMeta({ isSuccess: true, isComplete: true }));

const invalidLinkError = (world: World): Promise<void> =>
  settles(() =>
    world.expectContext!({ error: { status: INVALID_LINK_STATUS } })
  );

const apiError = (world: World): Promise<void> => {
  if (refusedStatus === undefined) {
    throw new Error("no API refusal was armed by a Given");
  }
  return settles(() =>
    world.expectContext!({ error: { status: refusedStatus } })
  );
};

const sentNothing = (world: World): Promise<void> =>
  settles(() => world.expectContext!({ twoFAProvider: null }));

const expiredOrInvalid = (world: World): Promise<void> =>
  settles(() =>
    world.expectMeta({ isExpiredOrInvalid: true, hasErrors: true })
  );

// -----------------------------------------------------------------------------

export const authSteps = defineSteps(({ Given, When, Then }) => {
  Given("an activation landing for my link", async world => {
    link = { username: LINK_USERNAME, hash: LINK_HASH };
    refusedStatus = undefined;
    await boot(world);
  });

  Given("I hold a staff session and a client session", () => undefined);
  Given("my account already has a password", () => undefined);
  Given("my account already has a password but no name", () => undefined);
  Given("my account has no password", () => undefined);
  Given(
    "my account has two-factor sign-in with the TOTP provider",
    () => undefined
  );
  Given("the brand has an analytics id", () => undefined);
  Given("my browser holds the two analytics cookies", () => undefined);
  Given("the API refuses my link", () => {
    refusedStatus = refusedLinkRecording.response.status;
  });
  Given("the API refuses the activation", () => {
    refusedStatus = refusedGrantRecording.response.status;
  });
  Given("the API refuses me because my IP address is blocked", () => undefined);

  Given("my link expired in 2020", () => {
    link = { ...link, expires: EXPIRED_IN_2020 };
  });

  Given("my link has a username but no hash", () => {
    link = { username: LINK_USERNAME };
  });

  Given("my link asks to return to {string}", (_world, target) => {
    link = { ...link, redirect: String(target) };
  });

  Given("the landing waits at the set-password step", async world => {
    await checkLink(world);
    await settledAt(world, "needsPassword");
  });

  Given("the landing reached the activated state", async world => {
    await checkLink(world);
    await activated(world);
  });

  Given(
    "the landing refused my link with the invalid-link error",
    async world => {
      link = { username: LINK_USERNAME };
      await checkLink(world);
      await invalidLinkError(world);
    }
  );

  When("the landing checks my link", checkLink);

  When("nobody starts the landing", () => undefined);

  When(
    "I submit the password {string} with the confirmation {string}",
    (world, password, confirmation) =>
      submitPassword(world, String(password), String(confirmation))
  );

  When("I submit a valid password with an equal confirmation", world =>
    submitPassword(world, VALID_PASSWORD, VALID_PASSWORD)
  );

  When("the consumer waits for my new client session", world =>
    world.fire(ACTIONS.isReady)
  );

  When("the consumer retries", world => world.fire(ACTIONS.reset));

  When("the consumer destroys the landing and opens it again", async world => {
    await world.fire(ACTIONS.destroy);
    await boot(world);
  });

  Then("the link check goes out once with my username and my hash", world =>
    settles(() => world.expectContext!({ model: { username: LINK_USERNAME } }))
  );

  Then("it carries my client session and never my staff session", world =>
    settles(() =>
      world.expectMeta({
        isVerifying: false,
        isExpiredOrInvalid: false,
        hasErrors: false
      })
    )
  );

  Then(
    "the activation goes out once with no password and no session",
    activated
  );

  Then(
    "the activation goes out once with my password and without the confirmation",
    activated
  );

  Then("the landing reaches the activated state", activated);

  Then("my client session holds the new access token", world =>
    settles(async () => {
      await world.expectMeta({ isSuccess: true });
      await world.expectContext!({ sessionId: GRANTED_SESSION_ID });
    })
  );

  Then("the landing reports the new session id", world =>
    settles(() => world.expectContext!({ sessionId: GRANTED_SESSION_ID }))
  );

  Then("the landing reports that it is verifying", world =>
    world.expectMeta({ isVerifying: true })
  );

  Then("it reports no other outcome", world =>
    world.expectMeta({
      isSuccess: false,
      isExpiredOrInvalid: false,
      needsPassword: false,
      hasErrors: false,
      isProcessing: false
    })
  );

  Then("no request goes out", async world => {
    await world.expectMeta({ isProcessing: false });
    await sentNothing(world);
  });

  Then("the new landing waits and sends nothing", async world => {
    await world.expectMeta({ isVerifying: true, isProcessing: false });
    await sentNothing(world);
  });

  Then("the landing reports that two-factor sign-in is necessary", world =>
    settles(() => world.expectMeta({ twoFARequired: true }))
  );

  Then("it reports the provider as totp", world =>
    settles(() => world.expectContext!({ twoFAProvider: "totp" }))
  );

  Then("the landing reports that a complete step is necessary", world =>
    settles(() => world.expectMeta({ needsCompleteStep: true }))
  );

  Then("the landing waits at the set-password step", world =>
    settledAt(world, "needsPassword")
  );

  Then("it stays at the set-password step", world =>
    settledAt(world, "needsPassword")
  );

  Then("it offers the set-password form with my username filled in", world =>
    settles(() =>
      world.expectContext!({
        model: { username: LINK_USERNAME },
        schema: { type: "object" }
      })
    )
  );

  Then("no activation goes out", world =>
    world.expectMeta({ isSuccess: false, isComplete: false })
  );

  Then(
    "the landing reports one validation error for the {} under the {word} rule",
    (world, field, rule) =>
      settles(() =>
        world.expectContext!({
          validationErrors: [
            {
              instancePath: `/${String(field).replace(" ", "_")}`,
              keyword: String(rule)
            }
          ]
        })
      )
  );

  Then(
    "the landing reports the expired-or-invalid outcome with the invalid-link error",
    async world => {
      await expiredOrInvalid(world);
      await invalidLinkError(world);
    }
  );

  Then(
    "the landing reports the expired-or-invalid outcome with the API error",
    async world => {
      await expiredOrInvalid(world);
      await apiError(world);
    }
  );

  Then("it reports the expired-or-invalid outcome again", async world => {
    await expiredOrInvalid(world);
    await invalidLinkError(world);
  });

  Then(
    "the landing checks the same link values again, with no request when a value is missing",
    world => settles(() => world.expectMeta({ isExpiredOrInvalid: true }))
  );

  Then(
    "the landing reports the completion failure with the API error",
    async world => {
      await settledAt(world, "completionFailed");
      await apiError(world);
    }
  );

  Then("it does not report the expired-or-invalid outcome", world =>
    world.expectMeta({ isExpiredOrInvalid: false })
  );

  Then(
    "the reported error keeps the refusal status and the blocked-address code",
    world =>
      settles(() =>
        world.expectContext!({
          error: { status: 403, apiCode: "ip_address_disallowed" }
        })
      )
  );

  Then("the activation carries my analytics client id and session id", world =>
    activated(world)
  );

  Then("the landing offers the return path {string}", (world, offered) =>
    settles(() =>
      offered === "none"
        ? world.expectAbsent!("evil.example")
        : world.expectContext!({ redirect: String(offered) })
    )
  );

  Then("no route change happens", world => settledAt(world, "success"));

  Then("the consumer gets my signed-in user", world =>
    settles(async () => {
      await world.expectMeta({ isSuccess: true });
      await world.expectContext!({ sessionId: GRANTED_SESSION_ID });
    })
  );
});

export default authSteps;
