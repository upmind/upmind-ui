<template>
  <Header :title="t('action.create_account')">
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
  </Header>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { ROUTE } from "@upmind-automation/headless";
import { Link } from "@upmind-automation/upmind-ui";
import Header from "../../../../components/content/Header.vue";

const { t } = useI18n();
</script>
