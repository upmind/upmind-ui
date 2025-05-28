<template>
  <article>
    <ContentSection>
      <Interstitial
        v-bind="props"
        :animatedIcon="animatedIcon"
        :actions="actions"
        :title="t(`${safeKey}.title`)"
        :text="t(`${safeKey}.text`)"
      >
        <template #title>
          <SmartTitle :i18n-key="`${safeKey}.title`" align="center" />
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// -- components
import {
  Interstitial,
  type InterstitialActionProps,
} from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { computed } from "vue";
import { isEmpty, isNil } from "lodash-es";
// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;

const props = withDefaults(
  defineProps<
    {
      status?: number;
      i18nKey?: string;
      action: "refresh" | "store";
    } & InterstitialProps
  >(),
  {
    open: true,
    modal: true,
    skrim: "light",
    action: "refresh",
    animatedIcon: () => ({
      icon: "error",
      trigger: "loop",
      primaryColor: "base-foreground",
      secondaryColor: "tertiary",
      size: "4xl",
    }),
  }
);

const useGeneric = computed(() => {
  return !useStatus.value && !useProvided.value;
});
const useProvided = computed(() => {
  if (!props.i18nKey) return false;
  const messages = tm(props.i18nKey);
  return !isEmpty(messages);
});
const useStatus = computed(() => {
  return !isEmpty(tm(`errors.${props.status}`));
});

const safeKey = computed(() => {
  if (useProvided.value) return props.i18nKey;
  if (useStatus.value) return `errors.${props.status}`;
  if (useGeneric.value) return "errors.generic";
});

const animatedIcon = computed(() => ({
  icon: (props.status ?? 0) >= 500 ? "unavailable" : "error",
  trigger: props.animatedIcon.trigger,
  primaryColor: props.animatedIcon.primaryColor,
  secondaryColor: props.animatedIcon.secondaryColor,
  size: props.animatedIcon.size,
}));

const translations = computed(() => {
  return {
    title: t(`${safeKey.value}.title`),
    text: t(`${safeKey.value}.text`),
    action: t(`${safeKey.value}.action`),
  };
});

const actions = computed((): InterstitialActionProps[] => {
  let href = "window.location.href";

  switch (props.action) {
    case "refresh":
    default:
      href = window.location.href;
      break;
    case "store":
      href = storefrontUrl;
      break;
  }

  const defaultAction: InterstitialActionProps = {
    as: "a",
    color: "secondary",
    href,
    prependIcon: {
      icon: t(`${safeKey.value}.icon`),
      size: "2xs",
    },
    label: translations.value.action,
  };
  return isNil(props.actions) ? [defaultAction] : props.actions;
});
</script>
