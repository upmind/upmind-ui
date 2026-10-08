<template>
  <Page :data-attrs="{ 'data-test-key': 'verify-registration-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.verify_registration_title") }}</PageTitle>
      <PageDescription>
        {{ t("labs.verify_registration_description") }}
      </PageDescription>
    </PageHeader>

    <PageBody class="gap-10">
      <Section
        id="verify-registration-link"
        value="verify-registration-link"
        icon="link-external-01"
        :label="t('labs.verify_registration_link')"
      >
        <div class="flex flex-col gap-3">
          <Input
            v-model="pastedLink"
            :placeholder="t('labs.verify_registration_link_placeholder')"
            :data-attrs="{ 'data-test-key': 'verify-registration-link-input' }"
          />
          <div class="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              :data-attrs="{ 'data-test-key': 'verify-registration-read-link' }"
              @click="readPastedLink"
            >
              {{ t("labs.verify_registration_read_link") }}
            </Button>
            <Button
              variant="primary"
              :loading="isStarting || meta.isProcessing.value"
              :disabled="context.currentState.value !== 'idle'"
              :data-attrs="{ 'data-test-key': 'verify-registration-start' }"
              @click="start"
            >
              {{ t("labs.verify_registration_start") }}
            </Button>
            <Button
              variant="outline"
              :disabled="meta.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'verify-registration-retry' }"
              @click="actions.reset()"
            >
              {{ t("labs.verify_registration_retry") }}
            </Button>
          </div>
        </div>
      </Section>

      <Alert
        v-if="isBlockedIp"
        variant="danger"
        :title="t('labs.verify_registration_blocked_ip')"
        :description="errorMessage"
        :data-attrs="{ 'data-test-key': 'verify-registration-blocked-ip' }"
      >
        <template #icon><Icon icon="lock-01" /></template>
      </Alert>

      <Alert
        v-else-if="isFailure"
        variant="danger"
        :title="
          meta.isExpiredOrInvalid.value
            ? t('labs.verify_registration_expired')
            : t('labs.verify_registration_completion_failed')
        "
        :description="
          errorMessage ?? t('labs.verify_registration_expired_text')
        "
        :data-attrs="{ 'data-test-key': 'verify-registration-expired' }"
      >
        <template #icon><Icon icon="alert-triangle" /></template>
        <template #action>
          <Button as-child variant="outline" size="sm">
            <NuxtLink to="/" data-test-key="verify-registration-dashboard">
              {{ t("labs.verify_registration_dashboard") }}
            </NuxtLink>
          </Button>
        </template>
      </Alert>

      <Section
        v-if="context.currentState.value === 'needsPassword'"
        id="verify-registration-set-password"
        value="verify-registration-set-password"
        icon="lock-01"
        :label="t('labs.verify_registration_set_password')"
      >
        <Form
          class="max-w-xl"
          :schema="context.schema.value"
          :uischema="context.uischema.value"
          :model-value="context.model.value"
          :additional-errors="formErrors"
          :data-attrs="{ 'data-test-key': 'verify-registration-form' }"
          @update:model-value="actions.set($event)"
          @resolve="actions.completeRegistration()"
        >
          <template #actions="{ doResolve }">
            <Button
              block
              variant="primary"
              :loading="meta.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'verify-registration-submit' }"
              @click="doResolve"
            >
              {{ t("labs.verify_registration_submit") }}
            </Button>
          </template>
        </Form>
      </Section>

      <Alert
        v-if="meta.isSuccess.value"
        appearance="muted"
        variant="success"
        :title="t('labs.verify_registration_signed_in')"
        :description="
          userError
            ? t('labs.verify_registration_user_error')
            : signedInUser
              ? t('labs.verify_registration_signed_in_as', {
                  name: signedInUser.fullName || signedInUser.email
                })
              : t('labs.verify_registration_verifying')
        "
        :data-attrs="{ 'data-test-key': 'verify-registration-success' }"
      >
        <template #icon><Icon icon="check-circle" /></template>
        <template #action>
          <Button as-child variant="outline" size="sm">
            <NuxtLink
              :to="context.redirect.value ?? '/'"
              data-test-key="verify-registration-continue"
            >
              {{ t("labs.verify_registration_continue") }}
            </NuxtLink>
          </Button>
        </template>
      </Alert>

      <Section
        id="verify-registration-state"
        value="verify-registration-state"
        icon="shield-tick"
        :label="t('labs.verify_registration_state')"
      >
        <div class="flex flex-col gap-4">
          <MetaPanel :meta="metaFlags" />
          <ContextPanel :context="contextValues" />
        </div>
      </Section>
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useVerifyRegistration/verify-registration.page
 * @description The consumer of `useVerifyRegistration`. It passes the link
 * values, waits its own delay, renders each outcome, and offers the links —
 * it never changes the route itself.
 *
 * Driving it by hand:
 * - Get a real link: register a client on the staging brand with the
 *   "Send registration email" action (no password set), or create one in the
 *   admin with a password. The email holds `/verify?username=…&hash=…`.
 * - Paste the link and press "Read link", or open this page with the link's
 *   query. Then press "Verify link". The landing starts after 1000 ms.
 * - No password: the set-password form renders. A mismatch shows "Enter the
 *   same password again". A valid submit signs you in.
 * - A password already set: the landing signs you in at once.
 * - A used or made-up hash, or a missing value: the expired panel and a
 *   dashboard link. Add `expires=2020-01-01` to a no-password link to see the
 *   expired panel at the set-password step.
 * - "Try again" runs the link check again. A link is single-use, so a retry
 *   after success reports it as expired.
 */

import {
  Alert,
  Button,
  Input,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle
} from "@upmind/ui";
import { computed, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Form, Icon, Section } from "@upmind-automation/foundation";
import {
  LINK_PARAMS,
  responseCodes,
  ScopeActorTypes,
  useActiveSession,
  useVerifyRegistration
} from "@upmind-automation/headless";
import { QUERY_PARAMS } from "@upmind-automation/types";
import ContextPanel from "../runtime/components/ContextPanel.vue";
import MetaPanel from "../runtime/components/MetaPanel.vue";
import { map, mapValues, toString } from "lodash-es";
import type {
  SessionUser,
  VerifyRegistrationParams
} from "@upmind-automation/headless";

const START_DELAY_MS = 1000;
const SESSION_SWITCH_TIMEOUT_MS = 10000;
const BLOCKED_IP_CODE = "ip_address_disallowed";

const { t, te } = useI18n();
const route = useRoute();

await useActiveSession().useActions().isReady();

const landing = useVerifyRegistration().as(ScopeActorTypes.SELF);
const actions = landing.useActions();
const context = landing.useContext();
const meta = landing.useMeta();

/** The link values, read from this page's own query. */
function readLink(query: URLSearchParams | Record<string, unknown>) {
  const read = (key: string) =>
    query instanceof URLSearchParams
      ? (query.get(key) ?? undefined)
      : query[key]
        ? toString(query[key])
        : undefined;
  return {
    username: read(QUERY_PARAMS.USERNAME),
    hash: read(QUERY_PARAMS.HASH),
    expires: read(LINK_PARAMS.EXPIRES),
    redirect: read(LINK_PARAMS.REDIRECT)
  };
}

const link = ref<VerifyRegistrationParams>(readLink(route.query));
const pastedLink = ref("");
const isStarting = ref(false);
const signedInUser = ref<SessionUser>();
const userError = ref<unknown>();

function readPastedLink() {
  try {
    link.value = readLink(new URL(pastedLink.value).searchParams);
  } catch {
    link.value = {};
  }
}

let startTimer: ReturnType<typeof setTimeout> | undefined;

function start() {
  isStarting.value = true;
  startTimer = setTimeout(() => {
    isStarting.value = false;
    actions.verify(link.value);
  }, START_DELAY_MS);
}

let stopSwitchWait: (() => void) | undefined;

/**
 * Wait for the new session, then for its user. The wait is bounded: when
 * another client is signed in the active session never becomes the new one
 * and the session store keeps the signed-in client, so the panel shows the error text instead of
 * "Checking the link" for ever.
 */
function readNewSession(sessionId: string): Promise<SessionUser> {
  const session = useActiveSession();
  const { sessionId: activeSessionId } = session.useContext();
  const switched =
    activeSessionId.value === sessionId
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            stopSwitchWait?.();
            reject(new Error(t("labs.verify_registration_user_error")));
          }, SESSION_SWITCH_TIMEOUT_MS);
          const stop = watch(activeSessionId, next => {
            if (next !== sessionId) return;
            stopSwitchWait?.();
            resolve();
          });
          stopSwitchWait = () => {
            clearTimeout(timer);
            stop();
            stopSwitchWait = undefined;
          };
        });
  return switched.then(() => session.useActions().whenAuthenticated());
}

watch(
  () => meta.isSuccess.value && context.sessionId.value,
  sessionId => {
    if (!sessionId) return;
    readNewSession(sessionId)
      .then(user => (signedInUser.value = user))
      .catch(error => (userError.value = error));
  }
);

const isBlockedIp = computed(
  () =>
    context.error.value?.status === responseCodes.Forbidden &&
    context.error.value?.apiCode === BLOCKED_IP_CODE
);

const isFailure = computed(
  () => meta.isExpiredOrInvalid.value || meta.hasErrors.value
);

/**
 * The landing's message is a catalogue key until headless localisation is
 * booted, and finished text after; only a key is translated here.
 */
const errorMessage = computed(() => {
  const message = context.error.value?.message;
  return message && te(message) ? t(message) : message;
});

/**
 * A confirmation mismatch is raised by the landing with no copy of its own, so
 * its text comes from the field's catalogue entry rather than headless
 * localisation.
 */
const formErrors = computed(() =>
  map(context.validationErrors.value, error =>
    error.keyword === "const"
      ? { ...error, message: t("form.auth_set_password_confirmation.error") }
      : error
  )
);

const metaFlags = computed(() => mapValues(meta, flag => flag.value));

const contextValues = computed(() =>
  mapValues(context, member => member.value)
);

onUnmounted(() => {
  clearTimeout(startTimer);
  stopSwitchWait?.();
  actions.destroy();
});
</script>
