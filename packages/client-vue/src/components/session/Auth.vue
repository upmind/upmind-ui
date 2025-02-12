<template>
  <div
    class="auth"
    :class="cn(styles.session.auth.root, $props.class)"
    v-if="!meta.isAuthenticated"
  >
    <Form
      :key="modelValue"
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="errors?.data"
      :color="color"
      @reject="doReject"
      @resolve="doResolve"
      :class="styles.session.auth.form"
      :actions="authActions"
    />
  </div>

  <div :class="styles.session.auth.actions">
    <slot name="toggle">
      <div
        v-if="meta.showRegisterForm || meta.showLoginForm"
        @click="toggleForm(meta.showRegisterForm ? 'login' : 'register')"
      >
        <Link>
          <span class="font-normal">
            {{ buttonText }}
          </span>
          &nbsp;{{ buttonAction }}
        </Link>
      </div>
    </slot>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import { useSession } from "@upmind-automation/headless-vue";
import Form from "../form/Form.vue";
import { useStyles, cn, Link } from "@upmind-automation/upmind-ui";
import config from "./session.config";

// --- custom elements
import { Button } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { AuthProps } from "./types";
// -----------------------------------------------------------------------------

const emit = defineEmits(["update:modelValue", "resolve", "reject"]);
const props = withDefaults(defineProps<AuthProps>(), {
  modelValue: "login",
  color: "secondary",
});

const { t } = useI18n();

const {
  meta,
  errors,
  showLogin,
  showRegister,
  verify2fa,
  model,
  schema,
  uischema,
  resolve,
  reject,
} = useSession();

const styles = useStyles(["session.auth"], meta, config) as ComputedRef<{
  session: {
    auth: {
      root: string;
      form: string;
      actions: string;
    };
  };
}>;

const modelValue = useVModel(props, "modelValue", emit);

// ---

const authActions = computed(() => {
  return {
    submit: {
      type: "submit" as "submit",
      label: meta.value.showLoginForm
        ? t("auth.actions.login")
        : meta.value.showRegisterForm
          ? t("auth.actions.register")
          : t("auth.actions.continue"),
      block: true,
      needsValid: true,
    },
  };

  // TODO: implement forgot password flow
  // if (this.meta.showLoginForm) {
  //   actions.forgot = {
  //     label: this.t("auth.actions.forgot"),
  //     block: true,
  //     variant: "link",
  //     size: "sm",
  //     action: () => this.toggleForm("forgot"),
  //   };
  // }
});

function toggleForm(type: AuthProps["modelValue"]) {
  switch (type) {
    case "login":
      if (!meta.value.showLoginForm)
        showLogin().then(() => (modelValue.value = type));
      break;
    case "register":
      if (!meta.value.showRegisterForm)
        showRegister().then(() => (modelValue.value = type));
      break;
    // case "forgot":
    //   if (!meta.value.showForgotForm)
    //     showForgot().then(() => (modelValue.value = type));
  }
}

function doResolve(model: any) {
  resolve(model).then(() => emit("resolve", model));
}

function doReject() {
  reject().then(() => emit("reject"));
}

onMounted(() => {
  toggleForm(modelValue.value);
});

const buttonText = computed(() => {
  return meta.value.showRegisterForm
    ? t("session.unauthenticated.register.actions.text")
    : t("session.unauthenticated.login.actions.text");
});

const buttonAction = computed(() => {
  return meta.value.showRegisterForm
    ? t("session.unauthenticated.register.actions.action")
    : t("session.unauthenticated.login.actions.action");
});

watch(meta, ({ canShowForms }) => {
  if (canShowForms) {
    toggleForm(modelValue.value);
  }
});
</script>
