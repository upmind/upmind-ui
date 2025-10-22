<template>
  <Section
    v-if="meta.hasProducts"
    :title="t('text.summary')"
    aside
    icon="shopping-bag-02"
  >
    <Summary :actions="false" />
  </Section>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBasket } from "@upmind-automation/headless";
import Section from "../../../../components/content/LayoutSection.vue";
import Summary from "../../../basket/components/Summary.vue";

const { t } = useI18n();
const { meta } = useBasket();
</script>
