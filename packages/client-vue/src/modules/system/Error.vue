<template>
  <Layout>
    <ContentSection v-auto-animate class="flex flex-grow items-center">
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
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { vAutoAnimate } from "@formkit/auto-animate";

// -- components
import {
  Interstitial,
  type InterstitialActionProps,
  Layout
} from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { computed } from "vue";
import { isEmpty, isNil } from "lodash-es";
import { ROUTE, useBrand } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------
const { t, tm } = useI18n();
const router = useRouter();
const { storefrontUrl } = useBrand();

const props = withDefaults(
  defineProps<
    {
      status?: number;
      i18nKey?: string;
    } & InterstitialProps
  >(),
  {
    open: true,
    modal: true,
    skrim: "light",
    animatedIcon: () => ({
      icon: "error",
      trigger: "loop",
      primaryColor: "base-foreground",
      secondaryColor: "tertiary",
      size: "4xl"
    })
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
  size: props.animatedIcon.size
}));

const translations = computed(() => {
  return {
    title: t(`${safeKey.value}.title`),
    text: t(`${safeKey.value}.text`),
    action: t(`${safeKey.value}.action`)
  };
});

const actions = computed((): InterstitialActionProps[] => {
  let href = "window.location.href";

  switch (props.status) {
    // for service errors, we want to reload the page as its likely a temporary issue
    case 500:
    case 503:
      href = window.location.href;
      break;

    // for al lother errors, we want to redirect back to the storefront
    default:
      href = storefrontUrl.value;
      break;
  }

  const defaultAction: InterstitialActionProps = {
    as: "a",
    color: "secondary",
    href,
    prependIcon: {
      icon: t(`${safeKey.value}.icon`),
      size: "2xs"
    },
    label: translations.value.action
  };
  return isNil(props.actions) ? [defaultAction] : props.actions;
});
</script>
