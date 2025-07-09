<template>
  <header
    class="bg-base-background text-base-foreground border-b-border top-0 z-[20] flex w-full flex-col items-center border-b px-2 py-3 transition-all duration-500 md:px-0"
  >
    <div
      class="max-w-app mx-auto flex h-14 w-full items-center justify-between"
    >
      <a id="logo" class="relative z-20" :href="storefrontUrl ?? '/'">
        <picture class="h-full w-full">
          <slot name="logo" :logo="logo">
            <img v-if="logo" :src="logo" class="h-8 w-auto" alt="logo" />
          </slot>
          <span class="sr-only">
            {{ t("header.title") }}
          </span>
        </picture>
      </a>

      <VHeaderButtons>
        <template #actions> <slot name="actions" /></template>
      </VHeaderButtons>
    </div>
  </header>
</template>

<script lang="ts" setup>
import upmindLogo from "../../assets/logo.svg";

// --- external
import { useI18n } from "vue-i18n";
import { useBrand } from "@upmind-automation/headless";

// --- components
import VHeaderButtons from "./HeaderButtons.vue";
import { computed } from "vue";

const { image, isReady, storefrontUrl } = useBrand();

await isReady();
const imageUrl = image.value?.full_url;

// -----------------------------------------------------------------------------
const { t } = useI18n();
const props = defineProps<{ logo?: string }>();

const logo = computed(() => props.logo ?? imageUrl ?? upmindLogo);
</script>
