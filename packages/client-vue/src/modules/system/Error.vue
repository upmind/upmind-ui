<template>
  <Layout>
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        v-bind="props"
        :animatedIcon="animatedIcon"
        :actions="actions"
        :title="title"
        :text="text"
        data-testid="error"
      >
      </Interstitial>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// -- components
import {
  Interstitial,
  type InterstitialActionProps,
  Layout
} from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { computed } from "vue";
import { isNil } from "lodash-es";
import { utils, useBrand } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------
const { t } = useI18n();
const { responseCodes } = utils;
const { storefrontRoute } = useBrand();

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
    to: "#vue-app",
    animatedIcon: () => ({
      icon: "error",
      trigger: "loop",
      primaryColor: "base-foreground",
      secondaryColor: "tertiary",
      size: "4xl"
    })
  }
);

const title = computed(() => {
  if (props.i18nKey) return t(`${props.i18nKey}.title_md`);
  switch (props.status) {
    case responseCodes.Unauthorized:
      return t("error.401.title_md");
    case responseCodes.Forbidden:
      return t("error.403.title_md");
    case responseCodes.Not_Found:
      return t("error.404.title_md");
    case responseCodes.Too_Many_Requests:
      return t("error.429.title_md");
    case responseCodes.Internal_Server_Error:
      return t("error.500.title_md");
    case responseCodes.Service_Unavailable:
      return t("error.503.title_md");
    default:
      return t("error.generic.title_md");
  }
});

const text = computed(() => {
  if (props.i18nKey) return t(`${props.i18nKey}.text`);
  switch (props.status) {
    case responseCodes.Unauthorized:
      return t("error.404.text");
    case responseCodes.Forbidden:
      return t("error.403.text");
    case responseCodes.Not_Found:
      return t("error.404.text");
    case responseCodes.Too_Many_Requests:
      return t("error.429.text");
    case responseCodes.Internal_Server_Error:
      return t("error.500.text");
    case responseCodes.Service_Unavailable:
      return t("error.503.text");
    default:
      return t("error.generic.text");
  }
});

const icon = computed(() => {
  if (props.i18nKey) return t(`${props.i18nKey}.icon`);
  switch (props.status) {
    case responseCodes.Unauthorized:
      return t("error.401.icon");
    case responseCodes.Forbidden:
      return t("error.403.icon");
    case responseCodes.Not_Found:
      return t("error.404.icon");
    case responseCodes.Too_Many_Requests:
      return t("error.429.icon");
    case responseCodes.Internal_Server_Error:
      return t("error.500.icon");
    case responseCodes.Service_Unavailable:
      return t("error.503.icon");
    default:
      return t("error.generic.icon");
  }
});

const action = computed(() => {
  if (props.i18nKey) return t(`${props.i18nKey}.action`);
  switch (props.status) {
    case responseCodes.Unauthorized:
      return t("error.404.action");
    case responseCodes.Forbidden:
      return t("error.403.action");
    case responseCodes.Not_Found:
      return t("error.404.action");
    case responseCodes.Too_Many_Requests:
      return t("error.429.action");
    case responseCodes.Internal_Server_Error:
      return t("error.500.action");
    case responseCodes.Service_Unavailable:
      return t("error.503.action");
    default:
      return t("error.generic.action");
  }
});

const animatedIcon = computed(() => ({
  icon: (props.status ?? 0) >= 500 ? "unavailable" : "error",
  trigger: props.animatedIcon.trigger,
  primaryColor: props.animatedIcon.primaryColor,
  secondaryColor: props.animatedIcon.secondaryColor,
  size: props.animatedIcon.size
}));

const actions = computed((): InterstitialActionProps[] => {
  let route = storefrontRoute.value;

  switch (props.status) {
    // for service errors, we want to reload the page as its likely a temporary issue
    case responseCodes.Unauthorized:
    case responseCodes.Service_Unavailable:
    case responseCodes.Internal_Server_Error:
      route = {
        href: window.location.href
      };
      break;

    // for all other errors, we want to redirect back to the storefront
    default:
      route = storefrontRoute.value;
      break;
  }

  const defaultAction: InterstitialActionProps = {
    ...route,
    color: "secondary",
    icon: icon.value,
    label: action.value
  };

  return isNil(props.actions) ? [defaultAction] : props.actions;
});
</script>
