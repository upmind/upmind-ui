<template>
  <div class="auth" :class="styles.auth.root">
    <upw-tabs
      v-if="!meta.isAuthenticated"
      :tabs="tabs"
      v-model="active"
      @update:modelValue="toggleForm"
      size="sm"
    />

    <upw-form
      :key="active"
      :loading="meta.isFormLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="errors?.data"
      @reject="reject"
      @resolve="resolve"
      :class="styles.auth.form"
      :actions="authActions"
      v-if="meta.showLoginForm || meta.showRegisterForm || meta.show2fa"
    >
      <template #footer>
        <slot name="login.footer"></slot>
        <slot name="register.footer"></slot>
        <slot name="forgot.footer"></slot>
        <slot></slot>
      </template>
    </upw-form>

    <upw-button
      variant="ghost"
      block
      type="reset"
      @click.prevent="logout"
      v-if="meta.isAuthenticated"
    >
      logout
    </upw-button>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { UpwForm, UpwTabs, UpwButton } from "@upmind/upwind";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- types
import type { PropType } from "vue";
import type { AuthProps } from "./types";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "Auth",
  components: { UpwForm, UpwTabs, UpwButton },
  inheritAttrs: true,
  customOptions: {},
  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: String as PropType<AuthProps["form"]>,
      default: "login",
    },
  },
  setup(props) {
    const session = useSession();

    const styles = useStyles(["auth"], session.meta, config);

    return {
      ...session,
      styles,
      active: ref(props.modelValue),
    };
  },
  computed: {
    authActions() {
      const actions = {
        submit: {
          type: "submit",
          label: this.meta.showLoginForm
            ? "Log into my account"
            : this.meta.showRegisterForm
              ? "Create new account"
              : "Continue",
          block: true,
          needsValid: true,
        },
      };

      if (this.meta.showLoginForm) {
        actions.forgot = {
          label: "forgot password",
          block: true,
          variant: "link",
          size: "sm",
          action: () => this.toggleForm("forgot"),
        };
      }

      return actions;
    },
    tabs() {
      return [
        {
          id: "register",
          label: "New customer",
        },
        {
          id: "login",
          label: "Existing customer",
        },
      ];
    },
  },
  methods: {
    toggleForm(type: AuthProps.form) {
      switch (type) {
        case "login":
          if (!this.meta.showLoginForm) this.showLogin();
          break;
        case "register":
          if (!this.meta.showRegisterForm) this.showRegister();
          break;
        case "2fa":
          if (!this.meta.show2fa) this.show2fa();
          break;
      }
      this.active = type;
      this.$emit("update:modelValue", type);
    },
  },
  mounted() {
    if (this.modelValue === "register") {
      this.showRegister();
    } else {
      this.showLogin();
    }
  },
});
</script>
