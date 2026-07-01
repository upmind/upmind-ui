<template>
  <Link id="logo" :class="styles.header.link" v-bind="props.storefrontRoute">
    <picture v-if="logo" :class="styles.header.picture">
      <slot name="logo" :logo="logo">
        <img v-if="logo" :src="logo" :class="styles.header.image" alt="logo" />
      </slot>
      <span class="sr-only">
        {{ t("header.title") }}
      </span>
    </picture>
    <h3 v-else :class="styles.header.name">
      {{ name }}
    </h3>
  </Link>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useBrand } from "@upmind-automation/headless";
import { useStyles, Link } from "@upmind-automation/upmind-ui";
import config from "./header.config";
import type { StorefrontRoute } from "../../types";

const route = useRoute();
const { name, image } = useBrand();

// -----------------------------------------------------------------------------
const { t } = useI18n();
const props = defineProps<{
  logo?: string;
  storefrontRoute?: StorefrontRoute;
}>();

const layout = computed(() => {
  return route?.meta?.template;
});

const logo = computed(
  () => props.logo ?? `${image.value?.full_url}?size=400x400`
);

const styles = useStyles(["header"], { layout }, config);
</script>
