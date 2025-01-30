<template>
  <article>
    <UpmContentSection>
      <section
        class="relative flex w-full flex-col flex-wrap items-center justify-center gap-8 py-16"
      >
        <div>
          <IconAnimated
            v-for="(icon, index) in icons"
            :key="index"
            :ref="'icon' + index"
            :icon="icon.icon"
            size="3xl"
            secondary-color="accent"
            trigger="sequence"
            :sequence="icon.sequence"
          />
        </div>

        <h3 class="m-0 mt-4 text-center text-3xl text-inherit">
          <i18n-t
            keypath="errors.404.title"
            tag="span"
            for="errors.404.title"
            class="font-bold text-primary"
          >
            <mask class="bg-accent leading-relaxed">{{
              t("errors.404.page")
            }}</mask>
          </i18n-t>
        </h3>

        <p
          class="m-0 text-center text-sm leading-5 tracking-tight text-emphasis-medium"
        >
          {{ t("errors.404.description") }}
        </p>

        <footer class="flex w-full justify-center">
          <a :href="storefrontUrl">
            <Button :label="t('errors.404.action')" color="primary">
              <template #prepend>
                <Icon icon="arrow-left" size="2xs" />
              </template>
            </Button>
          </a>
        </footer>
      </section>
    </UpmContentSection>
  </article>
</template>

<script lang="ts" setup>
// ---
import { useI18n } from "vue-i18n";
// -- components
import { UpmContentSection } from "@upmind-automation/client-vue";
import { IconAnimated, Button, Icon } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;

const createRepeatSequence = (
  sequence: string,
  repetitions: number = 1
): string => {
  return Array(repetitions).fill(sequence).join(",play,");
};

const icons = [
  {
    icon: "four",
    sequence: createRepeatSequence(
      "delay:0,state:in-reveal,play,delay:2000,state:out-reveal,play,delay:0",
      50
    ),
  },
  {
    icon: "zero",
    sequence: createRepeatSequence(
      "delay:300,state:in-reveal,play,delay:1700,state:out-reveal,play,delay:0",
      50
    ),
  },
  {
    icon: "four",
    sequence: createRepeatSequence(
      "delay:600,state:in-reveal,play,delay:1400,state:out-reveal,play,delay:0",
      50
    ),
  },
];
</script>
