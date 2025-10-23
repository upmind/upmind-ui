<template>
  <Layout :variant="LAYOUT_VARIANTS.TWO_COLUMN_RTL" :currency="false">
    <template #content-header>
      <RegisterHeader />
    </template>

    <template #content>
      <Section title="Register" icon="user-03">
        <RegisterForm />
      </Section>
    </template>

    <template #aside>
      <Section :title="t('text.summary')" aside icon="shopping-bag-02">
        <RegisterAside />
      </Section>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { LAYOUT_VARIANTS } from "@upmind-automation/upmind-ui";
import Layout from "../../../components/layout/Layout.vue";
import Section from "../../../components/content/LayoutSection.vue";
import RegisterHeader from "./components/RegisterHeader.vue";
import RegisterForm from "./components/RegisterForm.vue";
import RegisterAside from "./components/RegisterAside.vue";

const { t } = useI18n();
</script>
