<template>
  <Hero :title="t('action.create_account')">
    <template #description>
      <span class="font-normal"
        >{{ t("auth.already_have_account_qn") }}&nbsp;</span
      >

      <Link
        :to="{ name: ROUTE.SESSION_LOGIN }"
        size="inherit"
        color="inherit"
        :label="t('action.log_in_here')"
        class="font-normal"
      />
    </template>
  </Hero>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { ROUTE } from "@upmind-automation/headless";

// --- components
import { Link } from "@upmind-automation/upmind-ui";
import Hero from "../../../components/hero/Hero.vue";

const { t } = useI18n();
</script>
