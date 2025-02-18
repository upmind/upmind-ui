<template>
  <article>
    <ContentSection>
      <Interstitial
        open
        modal
        skrim="light"
        :title="t('basket.notFound.text')"
        :text="t('basket.notFound.text')"
        :actions="[
          {
            color: 'primary',
            handler: back,
            prependIcon: 'arrow-left',
            label: t('basket.notFound.actions.continue'),
          },
        ]"
        :animatedIcon="{
          icon: 'basket',
          delay: 5000,
          primaryColor: 'primary',
          secondaryColor: 'accent',
          size: '4xl',
        }"
      >
        <template #title>
          <SmartTitle i18n-key="basket.notFound.title" size="2xl" />
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless-vue";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------
const { back } = useRoutingEngine();
const { t } = useI18n();
</script>
