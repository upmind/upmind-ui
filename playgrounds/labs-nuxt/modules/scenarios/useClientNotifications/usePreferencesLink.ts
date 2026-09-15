import { toast } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
  AuthFlowTypes,
  ScopeActorTypes,
  readClientEmailNotificationToken,
  readRecentClientEmails,
  useActiveSession,
  useAuth
} from "@upmind-automation/headless";
import { PreferencesLinkPhase } from "./usePreferencesLink.types";
import { find, map } from "lodash-es";
import type { ScenarioPageActionInstance } from "../runtime/scenario.types";
// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientNotifications/usePreferencesLink
 * @description Labs page action for the signed-in client: mint a fresh
 * notification-preferences link and open this page with it on the client actor.
 * It triggers a password reset (the same request that sends the preferences
 * email), polls the client's own email history for the new row, reads its footer
 * token, and navigates to `.../as/client?token=<token>`.
 *
 * Offered only to a signed-in (non-guest) client with a resolved id and email.
 * Progress and failures surface through one updating toast; the button's own
 * loading/disabled treatment reads `isRunning`.
 */

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;
const TOAST_ID = "client-notifications-preferences-link";

export function usePreferencesLink(): ScenarioPageActionInstance {
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const { activeUser } = useActiveSession().useContext();
  const { isClient, isGuestClient } = useActiveSession().useMeta();

  const phase = ref<PreferencesLinkPhase>(PreferencesLinkPhase.IDLE);

  const username = computed(() => activeUser.value?.email);

  const isOffered = computed(
    () =>
      isClient.value &&
      !isGuestClient.value &&
      !!activeUser.value?.id &&
      !!username.value
  );

  const isRunning = computed(
    () =>
      phase.value !== PreferencesLinkPhase.IDLE &&
      phase.value !== PreferencesLinkPhase.FAILED
  );

  function step(next: PreferencesLinkPhase, messageKey: string): void {
    phase.value = next;
    toast.loading(t(messageKey), { id: TOAST_ID });
  }

  function fail(reasonKey: string): void {
    phase.value = PreferencesLinkPhase.FAILED;
    toast.error(t("error.notification_preferences_link_failed"), {
      id: TOAST_ID,
      description: t(reasonKey)
    });
  }

  // The reset email is minted through a FRESH client auth instance so the recover
  // flow runs on `idle` rather than the active session's `authenticated` final
  // state, which offers no recover transition.
  async function requestResetEmail(name: string): Promise<boolean> {
    const auth = useAuth().as(ScopeActorTypes.CLIENT).fresh();
    const actions = auth.useActions();
    try {
      await actions.isReady();
      await actions.start(AuthFlowTypes.RECOVER);
      return await actions.resolve({ username: name });
    } finally {
      actions.destroy();
    }
  }

  async function pollForNewEmail(
    seen: Set<string>
  ): Promise<string | undefined> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      const rows = await readRecentClientEmails();
      const fresh = find(rows, row => !seen.has(row.id));
      if (fresh) return fresh.id;
    }
    return undefined;
  }

  async function run(): Promise<void> {
    const name = username.value;
    if (!isOffered.value || !name) return;

    try {
      step(
        PreferencesLinkPhase.REQUESTING,
        "text.notification_preferences_link_requesting"
      );
      const before = await readRecentClientEmails();
      const seen = new Set<string>(map(before, "id"));

      if (!(await requestResetEmail(name))) {
        fail("error.notification_preferences_link_failed");
        return;
      }

      step(
        PreferencesLinkPhase.WAITING,
        "text.notification_preferences_link_waiting"
      );
      const emailId = await pollForNewEmail(seen);
      if (!emailId) {
        fail("error.notification_preferences_link_timeout");
        return;
      }

      step(
        PreferencesLinkPhase.FOUND,
        "text.notification_preferences_link_token_found"
      );
      const token = await readClientEmailNotificationToken(emailId);
      if (!token) {
        fail("error.notification_preferences_link_no_token");
        return;
      }

      step(
        PreferencesLinkPhase.OPENING,
        "text.notification_preferences_link_opening"
      );
      toast.success(t("confirm.notification_preferences_link_ready"), {
        id: TOAST_ID
      });
      phase.value = PreferencesLinkPhase.IDLE;
      const base = route.path.replace(/\/$/, "");
      await router.push({
        path: `${base}/as/client`,
        query: { token }
      });
    } catch {
      fail("error.notification_preferences_link_failed");
    }
  }

  return { isOffered, isRunning, run };
}
