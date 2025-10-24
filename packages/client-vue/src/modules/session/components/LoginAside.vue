<template>
  <Section
    v-if="meta.hasProducts"
    :section="section"
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
