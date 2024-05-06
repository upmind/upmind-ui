<template>
  <div class="auth" :class="styles.auth.root">
    <div v-if="!meta.isAuthenticated">
      <div class="stats border w-full">
        <div
          class="stat bg-primary bg-opacity-10 indicator"
          @click.prevent="showRegister"
        >
          <span
            v-if="meta.showRegisterForm"
            class="indicator-item bg-primary text-primary-content aspect-square rounded-full p-1 m-4"
          >
            <check-icon class="w-5 h-5" />
          </span>

          <div class="stat-figure text-primary flex">
            <plus-icon class="w-8 h-8 -mr-4" />
            <user-icon class="w-16 h-16" />
          </div>
          <div class="stat-value text-xl text-primary whitespace-normal">
            New Customer
          </div>
          <div class="stat-title max-w-sm whitespace-normal">
            Create an account for faster checkout and access your orders.
          </div>
          <div class="stat-actions">
            <button class="btn btn-sm btn-primary">Register</button>
          </div>
        </div>

        <div
          class="stat bg-secondary bg-opacity-10 indicator"
          @click.prevent="showLogin"
        >
          <span
            v-if="meta.showLoginForm"
            class="indicator-item bg-secondary text-secondary-content aspect-square rounded-full p-1 m-4"
          >
            <check-icon class="w-5 h-5" />
          </span>

          <div class="stat-figure text-secondary flex">
            <check-icon class="w-8 h-8 -mr-4" />
            <user-icon class="w-16 h-16" />
          </div>
          <div class="stat-value text-xl text-secondary whitespace-normal">
            Existing Customer
          </div>
          <div class="stat-title max-w-sm whitespace-normal">
            Login to your account for a faster checkout and shopping experience.
          </div>
          <div class="stat-actions">
            <button class="btn btn-sm btn-secondary">Login</button>
          </div>
        </div>
      </div>

      <!-- <button @click="getUser" v-if="meta.isAuthenticated">get user</button> -->
      <button
        class="btn btn-ghost join-item"
        type="reset"
        @click.prevent="logout"
        v-if="meta.isAuthenticated"
      >
        logout
      </button>
    </div>

    <upw-form
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
    </upw-form>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { UpwForm } from "@upmind/upwind";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "Auth",
  components: { UpwForm },
  inheritAttrs: true,
  customOptions: {},
  emits: [],
  props: {
    show: {
      type: String as PropType<SessionProps["show"]>,
      default: "login",
    },
  },
  setup() {
    const session = useSession();

    const styles = useStyles(["auth"], session.meta, config);

    return {
      ...session,
      styles,
    };
  },
  computed: {
    authActions() {
      return {
        submit: {
          type: "submit",
          label: this.meta.showLoginForm
            ? "Log into my account"
            : this.meta.showRegisterForm
              ? "Create new account"
              : "Continue",
          block: true,
          disabled: !this.meta.isValid || this.meta.isProcessing,
          action: this.resolve,
        },
      };
    },
  },
  mounted() {
    if (this.show === "register") {
      this.showRegister();
    } else {
      this.showLogin();
    }
  },
});
</script>
