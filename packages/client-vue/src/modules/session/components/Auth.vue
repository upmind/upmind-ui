<template>
  <section v-if="canShowForms && !isLoading">
    <component
      :is="show2fa ? Interstitial : Slot"
      v-if="canShowForms && !isLoading"
      :open="show2fa"
      modal
      :title="interstitialTitle"
      :text="interstitialText"
      :animated-icon="{
        icon: '2fa',
        delay: 5000,
        primaryColor: 'primary',
        secondaryColor: 'secondary',
        size: '4xl'
      }"
      @reject="doReject"
    >
      <div class="auth" :class="cn(authRootVariants(), props.class)">
        <Alert
          v-if="hasErrors"
          variant="danger"
          :title="alertTitle"
          :description="errors"
          :data-attrs="{
            'data-test-value': 'auth'
          }"
        >
          <template #icon><Icon icon="alert-triangle" /></template>
        </Alert>

        <Form
          :disabled="isAuthenticated"
          :key="currentForm"
          :loading="isLoading"
          :processing="isProcessing"
          :model-value="model"
          :schema="schema"
          :uischema="formUischema"
          :additional-errors="validationErrors"
          :variant="variant"
          @reject="doReject"
          @resolve="doResolve"
          :autosave="show2fa"
          @update:model-value="set"
          :class="authFormVariants({ show2fa })"
          :actions="formActions"
          :dataAttrs="{
            'data-test-key': 'session-form',
            'data-test-value': currentForm
          }"
        >
          <template v-if="currentForm === SESSION_FORMS.REGISTER" #footer>
            <TermsAndConditions
              class="text-muted text-sm"
              :label="t('action.continue_label')"
            />
          </template>
        </Form>
      </div>

      <div v-if="showLoginForm && !show2fa" :class="authActionsVariants()">
        <slot name="toggle">
          <Link
            @click="toggleForm('recover')"
            color="muted"
            size="sm"
            :data-attrs="{ 'data-test-key': 'forgot-password-link' }"
            >{{ t("auth.forgot_password_qn") }}</Link
          >
        </slot>
      </div>
    </component>
  </section>
</template>

<script lang="ts" setup>
import { Slot } from "@upmind/ui";
import { cn, Interstitial, Link } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useActiveSession,
  useAuth,
  useRoutingEngine,
  type AuthModel
} from "@upmind-automation/headless";
import Form from "../../../components/form/Form.vue";
import { Icon } from "../../../components/icon";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import { SESSION_FORMS } from "../types";
import {
  authRootVariants,
  authFormVariants,
  authActionsVariants
} from "../variants";
import { find, get, map } from "lodash-es";
import type { FormActionProps } from "../../../components/form";
import type { SessionProps } from "../types";
// -----------------------------------------------------------------------------

const emit = defineEmits(["resolve", "reject"]);
const props = withDefaults(defineProps<Omit<SessionProps, "modelValue">>(), {
  variant: "primary"
});

const modelValue = defineModel<SessionProps["modelValue"]>("modelValue", {
  default: SESSION_FORMS.LOGIN
});

const { t } = useI18n();
const { navigate } = useRoutingEngine();

// --- Session for identity (authenticated flag drives form gating/disable)
const session = useActiveSession();
const { isAuthenticated } = session.useMeta();

// --- Auth for login/register/recover/2fa flows
const auth = useAuth().as(ScopeActorTypes.CLIENT);
const {
  canShowForms,
  hasErrors,
  isLoading,
  isProcessing,
  show2fa,
  showLoginForm,
  showRecoverPasswordForm,
  showRegisterForm
} = auth.useMeta();
const { errors, model, schema, uischema, validationErrors } = auth.useContext();
const { reject, resolve, set, start } = auth.useActions();

const currentForm = computed<SESSION_FORMS>(() => {
  if (showLoginForm.value) return SESSION_FORMS.LOGIN;
  if (showRegisterForm.value) return SESSION_FORMS.REGISTER;
  if (showRecoverPasswordForm.value) return SESSION_FORMS.RECOVER;
  return SESSION_FORMS.UNKNOWN;
});

const twofaI18nKey = computed(() => {
  if (!show2fa.value || !uischema.value) return "form.twofa";
  const elements = (uischema.value as { elements?: unknown[] }).elements;
  const element = find(elements, { scope: "#/properties/token" });
  return get(element, "i18n", "form.twofa");
});

const interstitialTitle = computed(() => t(`${twofaI18nKey.value}.label`));

const interstitialText = computed(() => t(`${twofaI18nKey.value}.description`));

const modal2faUischema = computed(() => {
  if (!show2fa.value || !uischema.value) return uischema.value;
  const elements = (uischema.value as { elements?: unknown[] }).elements ?? [];
  return {
    ...uischema.value,
    elements: map(elements, (el: Record<string, unknown>) =>
      el.scope === "#/properties/token"
        ? {
            ...el,
            i18n: undefined,
            label: "",
            options: {
              ...(el.options as Record<string, unknown>),
              size: "lg",
              align: "center"
            }
          }
        : el
    )
  };
});

const formUischema = computed(() =>
  show2fa.value ? modal2faUischema.value : uischema.value
);

const formActions = computed(() => {
  let label: string;
  let submitTestKey: string;
  switch (currentForm.value) {
    case SESSION_FORMS.LOGIN:
      label = t("action.log_in_to_your_account");
      submitTestKey = "button-log-into-my-account";
      break;
    case SESSION_FORMS.RECOVER:
      label = t("action.send_reset");
      submitTestKey = "button-send-reset";
      break;
    case SESSION_FORMS.REGISTER:
    default:
      label = t("action.continue_label");
      submitTestKey = "button-continue";
      break;
  }

  const actions: Record<string, FormActionProps> = {
    submit: {
      type: "submit" as const,
      label,
      block: true,
      needsValid: true,
      size: "lg" as const,
      dataAttrs: { "data-test-key": submitTestKey }
    }
  };

  if (show2fa.value) {
    actions.cancel = {
      type: "reset" as const,
      label: t("action.cancel"),
      block: true,
      size: "lg",
      variant: "link",
      ...(props.cancelRoute ?? {})
    };

    if (props.cancelRoute) {
      actions.cancel = {
        ...actions.cancel,
        to: props.cancelRoute
      } as FormActionProps;
    }
  }
  return actions;
});

const alertTitle = computed(() => {
  switch (currentForm.value) {
    case SESSION_FORMS.RECOVER:
      return t("error.session_recover_failed");
    case SESSION_FORMS.LOGIN:
      return t("error.session_login_failed");
    case SESSION_FORMS.REGISTER:
    default:
      return t("error.session_register_failed");
  }
});

async function toggleForm(type: SessionProps["modelValue"]) {
  switch (type) {
    case SESSION_FORMS.LOGIN:
      if (!showLoginForm.value) {
        start(AuthFlowTypes.LOGIN).then(() => {
          if (modelValue.value !== SESSION_FORMS.LOGIN)
            modelValue.value = SESSION_FORMS.LOGIN;
        });
      }
      break;
    case SESSION_FORMS.REGISTER:
      if (!showRegisterForm.value) {
        start(AuthFlowTypes.REGISTER).then(() => {
          if (modelValue.value !== SESSION_FORMS.REGISTER)
            modelValue.value = SESSION_FORMS.REGISTER;
        });
      }
      break;
    case SESSION_FORMS.RECOVER:
      if (!showRecoverPasswordForm.value) {
        start(AuthFlowTypes.RECOVER).then(() => {
          if (modelValue.value !== SESSION_FORMS.RECOVER)
            modelValue.value = SESSION_FORMS.RECOVER;
        });
      }
      break;
  }
}

function doResolve(model: unknown) {
  // Capture at submit time — after a successful login/register the machine
  // leaves the form state, so currentForm changes before the .then runs.
  const authenticates = currentForm.value !== SESSION_FORMS.RECOVER;
  resolve(model as AuthModel).then(async success => {
    if (!success) return;
    // The auth machine resolves as soon as it holds a token, but promoting the
    // active session + loading the user is the session store's job and lands a
    // beat later. Consumers of this emit (e.g. checkout registering inline)
    // re-read session-scoped state on resolve, so hand control back only once
    // the session is actually authenticated. RECOVER never authenticates, so
    // it emits immediately.
    if (authenticates) {
      try {
        await session.useActions().whenAuthenticated();
      } catch {
        // Token issued but the user load failed — escalate to the reject path
        // rather than hang the overlay waiting for a user that never loads.
        emit("reject");
        return;
      }
    }
    emit("resolve", model);
  });
}

function doReject() {
  reject().then(() => {
    emit("reject");
    // Form engine ignores an action's `to`, so navigate to the cancelRoute
    // ourselves (the checkout overlay sets it to the basket).
    const target = props.cancelRoute?.name?.toString();
    if (target) navigate(target);
  });
}

onMounted(() => {
  toggleForm(modelValue.value);
});

// --- esc key handler for 2fa modal
watch(show2fa, value => {
  if (value) {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") doReject();
    };
    document.addEventListener("keydown", handler);
    watch(show2fa, still => {
      if (!still) document.removeEventListener("keydown", handler);
    });
  }
});

watch(
  [canShowForms, isAuthenticated],
  async ([canShow, isAuth], [couldShow, wasAuth]) => {
    if (canShow && !couldShow) toggleForm(modelValue.value);
    if (isAuth && !wasAuth) {
      // isAuthenticated flips at actor promotion; the user object can land a
      // beat later — wait for the fully-loaded session before handing back.
      try {
        await session.useActions().whenAuthenticated();
      } catch {
        // User load failed after promotion — escalate rather than hang.
        emit("reject");
        return;
      }
      emit("resolve", model.value);
    }
  }
);

watch(modelValue, newValue => {
  toggleForm(newValue);
});

watch(isLoading, (isLoading, wasLoading) => {
  if (isLoading && !wasLoading) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});
</script>

<style>
.grecaptcha-badge {
  visibility: hidden;
}
</style>
