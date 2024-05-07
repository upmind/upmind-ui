<template>
  <article class="flex flex-col gap-4">
    <upm-session show="login" class="max-w-3xl">
      <template #header="{ meta, user }">
        <template v-if="!meta.isAuthenticated">
          <span class="text-lg font-light leading-7 text-base-700"
            >Already have an Account?</span
          >
          <h1>Sign in for a faster checkout.</h1>
        </template>
        <template v-if="meta.isAuthenticated">
          <span class="text-lg font-light leading-7 text-base-700"
            >Welcome Back!</span
          >
          <h1>{{ user?.fullname || user?.firstname }}</h1>
        </template>
      </template>

      <template #footer="{ meta }">
        <template v-if="meta.showRegisterForm">
          <p class="m-0">
            This form is protected by reCAPTCHA and Google's 
            <a href="#"> Privacy policy</a> and 
            <a href="#">Terms of service</a> apply.
          </p>
          <p class="m-0">
            By clicking 'Create new account' I agree to Mochahost's <a href="#">
              Terms & Conditions.
            </a>
          </p>
        </template>
      </template>
    </upm-session>
  </article>
</template>

<script>
import { defineComponent } from "vue";
// import * as messages from "./locales";
import { UpmSession } from "@upmind/client";
export default defineComponent({
  name: "Session",
  // i18n: { messages },
  components: { UpmSession },
});
</script>
