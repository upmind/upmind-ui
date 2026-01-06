<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :title="t('error.404_title_md')"
      :text="t('error.404_text')"
      :actions="actions"
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
import { computed } from "vue";
import { has } from "lodash-es";

// --- internal
import { useBrand } from "@upmind-automation/headless";

// -- components
import {
  Interstitial,
  IconAnimated,
  type InterstitialActionProps
} from "@upmind-automation/upmind-ui";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    InterstitialProps & {
      storefrontRoute?:
        | RouteLocationAsRelativeGeneric
        | { href: string }
        | null;
    }
  >(),
  {
    open: true,
    modal: true
  }
);

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { storefrontRoute: brandStorefrontRoute } = useBrand();

const actions = computed((): InterstitialActionProps[] => {
  const route = brandStorefrontRoute.value || props.storefrontRoute;
  const hasHref = has(route, "href");

  const action: any = {
    variant: "solid",
    color: "primary",
    icon: "arrow-left",
    label: t("action.back_to_shop")
  };

  if (hasHref) {
    action.href = (route as { href: string }).href;
  } else if (route) {
    action.to = route as RouteLocationAsRelativeGeneric;
  }

  return [action];
});

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
