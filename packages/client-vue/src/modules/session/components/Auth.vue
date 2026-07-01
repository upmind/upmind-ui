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
      <div class="auth" :class="cn(styles.session.auth.root, props.class)">
        <Alert
          v-if="hasErrors"
          color="danger"
          icon="alert-triangle"
          :title="alertTitle"
          :description="errors"
          data-testid="auth-alert"
        />

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
          :class="styles.session.auth.form"
          :actions="formActions"
          :data-testid="`${currentForm}-form`"
        >
          <template v-if="currentForm === SESSION_FORMS.REGISTER" #footer>
            <TermsAndConditions
              class="text-muted text-sm"
              :label="t('action.continue_label')"
            />
          </template>
        </Form>
      </div>

      <div
        v-if="showLoginForm && !show2fa"
        :class="styles.session.auth.actions"
      >
        <slot name="toggle">
          <Link
            @click="toggleForm('recover')"
            color="muted"
            :label="t('auth.forgot_password_qn')"
            size="lg"
            data-testid="forgot-password-link"
          />
        </slot>
      </div>
    </component>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  ScopeActorTypes,
  useActiveSession,
  useAuth,
  type AuthModel
} from "@upmind-automation/headless";
import {
  useStyles,
  cn,
  Interstitial,
  Slot,
  type FormActionProps
} from "@upmind-automation/upmind-ui";
import { Alert, Link } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import config from "../session.config";
import { SESSION_FORMS } from "../types";
import { find, get, map } from "lodash-es";
import type { SessionProps } from "../types";
// -----------------------------------------------------------------------------

const emit = defineEmits(["resolve", "reject"]);
const props = withDefaults(defineProps<Omit<SessionProps, "modelValue">>(), {
  variant: "solid"
});

const modelValue = defineModel<SessionProps["modelValue"]>("modelValue", {
  default: SESSION_FORMS.LOGIN
});

const { t } = useI18n();

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

const styles = useStyles(
  [
    "session.auth",
    "session.transitions.fade.enter",
    "session.transitions.fade.leave"
  ],
  computed(() => ({
    show2fa: show2fa.value
  })),
  config
);

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
  switch (currentForm.value) {
    case SESSION_FORMS.LOGIN:
      label = t("action.log_in_to_your_account");
      break;
    case SESSION_FORMS.RECOVER:
      label = t("action.send_reset");
      break;
    case SESSION_FORMS.REGISTER:
    default:
      label = t("action.continue_label");
      break;
  }

  const actions: Record<string, FormActionProps> = {
    submit: {
      type: "submit" as const,
      label,
      block: true,
      needsValid: true,
      size: "lg" as const,
      ...(currentForm.value === SESSION_FORMS.LOGIN
        ? { dataAttrs: { "data-testid": "button-log-into-my-account" } }
        : {})
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
        start("login").then(() => {
          if (modelValue.value !== SESSION_FORMS.LOGIN)
            modelValue.value = SESSION_FORMS.LOGIN;
        });
      }
      break;
    case SESSION_FORMS.REGISTER:
      if (!showRegisterForm.value) {
        start("register").then(() => {
          if (modelValue.value !== SESSION_FORMS.REGISTER)
            modelValue.value = SESSION_FORMS.REGISTER;
        });
      }
      break;
    case SESSION_FORMS.RECOVER:
      if (!showRecoverPasswordForm.value) {
        start("recover").then(() => {
          if (modelValue.value !== SESSION_FORMS.RECOVER)
            modelValue.value = SESSION_FORMS.RECOVER;
        });
      }
      break;
  }
}

function doResolve(model: unknown) {
  resolve(model as AuthModel).then(success => {
    if (success) {
      emit("resolve", model);
    }
  });
}

function doReject() {
  reject().then(() => emit("reject"));
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
  ([canShow, isAuth], [couldShow, wasAuth]) => {
    if (canShow && !couldShow) toggleForm(modelValue.value);
    if (isAuth && !wasAuth) {
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
