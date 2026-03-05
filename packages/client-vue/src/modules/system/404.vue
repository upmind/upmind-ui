<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :title="t('error.404_title_md')"
      :text="t('error.404_text')"
      :actions="[
        {
          ...props.storefrontRoute,
          variant: 'solid',
          color: 'primary',
          icon: 'arrow-left',
          label: t('action.back_to_shop')
        }
      ]"
    >
      <template #avatar>
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
      </template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal

// -- components
import { Interstitial, IconAnimated } from "@upmind-automation/upmind-ui";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import type { StorefrontRoute } from "../../types";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    InterstitialProps & {
      storefrontRoute: StorefrontRoute;
    }
  >(),
  {
    open: true,
    modal: true
  }
);

// -----------------------------------------------------------------------------

const { t } = useI18n();

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
    )
  },
  {
    icon: "zero",
    sequence: createRepeatSequence(
      "delay:300,state:in-reveal,play,delay:1700,state:out-reveal,play,delay:0",
      50
    )
  },
  {
    icon: "four",
    sequence: createRepeatSequence(
      "delay:600,state:in-reveal,play,delay:1400,state:out-reveal,play,delay:0",
      50
    )
  }
];
</script>
