<template>
  <article class="flex flex-col gap-4">
    <upm-session show="login">
      <template #header="{ meta }">
        <span class="block">Already have an Account?</span>
        <h1 class="m-0">Sign in for a faster checkout.</h1>
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
