<template>
  <article>
    <ContentSection>
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

        <SmartTitle
          i18n-key="errors.404.title"
          class="mt-4"
          align="center"
          size="3xl"
        />

        <p
          class="text-emphasis-medium m-0 max-w-md text-center text-lg leading-normal"
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
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// -- components
import ContentSection from "../../components/content/ContentSection.vue";
import { IconAnimated, Button, Icon } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
// @ts-ignore
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
