<template>
  <Section
    v-if="meta.hasProducts"
    :active="section"
    label="t('text.summary')"
    icon="shopping-bag-02"
  >
    <Summary :showPromotions="false" show-products />
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket } from "@upmind-automation/headless";

// --- components
import Summary from "../../basket/components/Summary.vue";
import Section from "../../../components/section/Section.vue";

interface Props {
  section?: boolean;
}

withDefaults(defineProps<Props>(), {
  section: false
});

const { t } = useI18n();
const { meta } = useBasket();
</script>
