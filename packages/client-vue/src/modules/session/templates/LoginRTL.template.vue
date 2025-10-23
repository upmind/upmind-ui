<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL" :currency="false">
    <template #content-header>
      <LoginHeader />
    </template>

    <template #content>
      <Section title="Login" icon="user-03">
        <LoginForm />
      </Section>
    </template>

    <template #aside>
      <Section :title="t('text.summary')" aside icon="shopping-bag-02">
        <LoginAside />
      </Section>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- components
import Layout from "../../../components/layout/Layout.vue";
import Section from "../../../components/content/LayoutSection.vue";
import LoginHeader from "../components/LoginHeader.vue";
import LoginForm from "../components/LoginForm.vue";
import LoginAside from "../components/LoginAside.vue";

// --- types
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";

const { t } = useI18n();
</script>
