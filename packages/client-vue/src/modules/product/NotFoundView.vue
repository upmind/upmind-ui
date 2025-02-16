<template>
  <article>
    <ContentSection>
      <NotFound
        open
        modal
        skrim="light"
        :text="t('basket.notFound.text')"
        :action="{
          color: 'primary',
          handler: back,
          prependIcon: 'arrow-left',
          label: t('basket.notFound.actions.continue'),
        }"
      >
        <template #title>
          <SmartTitle i18n-key="basket.notFound.title" size="2xl" />
        </template>
      </NotFound>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// ---
import { useI18n } from "vue-i18n";
// -- components
import { useRoutingEngine } from "@upmind-automation/headless-vue";
import NotFound from "./components/NotFound.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------
const { back } = useRoutingEngine();
const { t } = useI18n();
</script>
