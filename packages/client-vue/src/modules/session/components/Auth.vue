<template>
  <section>
    <div
      class="auth"
      :class="cn(styles.session.auth.root, props.class)"
      v-if="!meta.isAuthenticated && !meta.isLoading"
    >
      <Alert
        v-if="meta.hasErrors"
        color="danger"
        icon="alert-triangle"
        :title="alertTitle"
        :description="errors"
      />

      <Form
        :key="currentForm"
        :loading="meta.isLoading"
        :processing="meta.isProcessing"
        :model-value="model"
        :schema="schema"
        :uischema="uischema"
        :additional-errors="validationErrors"
        :variant="variant"
        @reject="doReject"
        @resolve="doResolve"
        @update:model-value="setModel"
        :class="styles.session.auth.form"
        :actions="authActions"
      >
        <template v-if="currentForm === 'register'" #footer>
          <TermsAndConditions
            class="text-muted text-sm"
            :label="t('action.continue_label')"
          />
        </template>
      </Form>
    </div>

    <div v-if="!meta.isLoading" :class="styles.session.auth.actions">
      <slot name="toggle">
        <Link
          v-if="!meta.isAuthenticated && meta.showLoginForm"
          @click="toggleForm('recover')"
          color="muted"
          :label="buttons.recover.label"
          size="lg"
        />
      </slot>
      <Button
        v-if="meta.isAuthenticated"
        variant="ghost"
        size="lg"
        block
        type="reset"
        @click.prevent="logout"
        :label="t('action.logout')"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import Form from "../../../components/form/Form.vue";
import config from "../session.config";
import { useSession } from "@upmind-automation/headless";
import { useStyles, cn } from "@upmind-automation/upmind-ui";

// --- custom elements
import { Alert, Button, Link } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { AuthProps } from "../types";
// -----------------------------------------------------------------------------

const emit = defineEmits(["resolve", "reject"]);
const props = withDefaults(defineProps<Omit<AuthProps, "modelValue">>(), {
  variant: "solid"
});

const modelValue = defineModel<AuthProps["modelValue"]>("modelValue", {
  default: "login"
});

const { t } = useI18n();

const {
  isReady,
  meta,
  errors,
  validationErrors,
  showLogin,
  showRegister,
  showRecoverPassword,
  model,
  schema,
  uischema,
  resolve,
  reject,
  logout,
  setModel
} = useSession();

await isReady();

const styles = useStyles(["session.auth"], meta, config) as ComputedRef<{
  session: {
    auth: {
      root: string;
      form: string;
      actions: string;
    };
  };
}>;

const currentForm = computed(() => {
  return meta.value.showLoginForm
    ? "login"
    : meta.value.showRegisterForm
      ? "register"
      : meta.value.showRecoverPasswordForm
        ? "recover"
        : "unknown";
});

const alertTitle = computed(() => {
  switch (currentForm.value) {
    case "register": {
      return t("form.register.error");
    }
    case "recover": {
      return t("form.recover.error");
    }
    case "login": {
      return t("form.login.error");
    }
  }
});

// ---

const buttons = computed(() => {
  return {
    register: {
      label: t("auth.already_have_account_qn"),
      action: t("action.log_in_here")
    },
    login: {
      label: t("auth.no_account_qn"),
      action: t("action.create_one_here")
    },
    recover: {
      label: t("auth.forgot_password_qn"),
      action: t("session.recover.actions.action")
    }
  };
});

const authActions = computed(() => {
  return {
    submit: {
      type: "submit" as const,
      label: meta.value.showLoginForm
        ? t("action.log_in_to_your_account")
        : meta.value.showRegisterForm
          ? t("action.continue_label")
          : meta.value.showRecoverPasswordForm
            ? t("action.send_reset")
            : t("action.continue_label"),
      block: true,
      needsValid: true,
      size: "lg" as const
    }
  };
});

function toggleForm(type: AuthProps["modelValue"]) {
  // if (meta.value.isAuthenticated) return;

  if (!meta.value.canShowForms) return;

  switch (type) {
    case "login":
      if (!meta.value.showLoginForm) {
        showLogin().then(() => (modelValue.value = "login"));
      }
      break;
    case "register":
      if (!meta.value.showRegisterForm) {
        showRegister().then(() => (modelValue.value = "register"));
      }
      break;
    case "recover":
      if (!meta.value.showRecoverPasswordForm) {
        showRecoverPassword().then(() => (modelValue.value = "recover"));
      }
      break;
  }
}

function doResolve(model: any) {
  resolve(model).then(success => {
    if (success) emit("resolve", model);
  });
}

function doReject() {
  reject().then(() => emit("reject"));
}

onMounted(() => {
  toggleForm(modelValue.value);
});

watch(meta, ({ canShowForms, isAuthenticated }) => {
  if (canShowForms) toggleForm(modelValue.value);
  if (isAuthenticated) {
    emit("resolve", model.value);
  }
});

watch(modelValue, newValue => {
  toggleForm(newValue);
});
</script>

<style>
.grecaptcha-badge {
  visibility: hidden;
}
</style>
