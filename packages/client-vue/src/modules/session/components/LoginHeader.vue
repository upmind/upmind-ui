<template>
  <Header :title="t('auth.welcome_back')">
    <template #description>
      <i18n-t keypath="auth.please_login_to_continue" scope="global" tag="span">
        <template #[`create_one_here`]>
          <Link
            :to="{ name: ROUTE.SESSION_REGISTER }"
            size="inherit"
            color="inherit"
            :label="t('auth.create_one_here')"
            class="font-normal"
          />
        </template>
      </i18n-t>
    </template>
  </Header>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { ROUTE } from "@upmind-automation/headless";
import { Link } from "@upmind-automation/upmind-ui";
import Header from "../../../components/content/Header.vue";

const { t } = useI18n();
</script>
