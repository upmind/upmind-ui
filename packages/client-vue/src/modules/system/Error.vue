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
    } & InterstitialProps
  >(),
  {
    open: true,
    modal: true,
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
  switch (props.status) {
    case responseCodes.Unauthorized:
      return t("error.401_title_md");
    case responseCodes.Forbidden:
      return t("error.403_title_md");
    case responseCodes.Not_Found:
      return t("error.404_title_md");
    case responseCodes.Too_Many_Requests:
      return t("error.429_title_md");
    case responseCodes.Internal_Server_Error:
      return t("error.500_title_md");
    case responseCodes.Service_Unavailable:
      return t("error.503_title_md");
    default:
      return t("error.generic_title_md");
  }
});

const text = computed(() => {
  switch (props.status) {
    case responseCodes.Unauthorized:
      return t("error.404_text");
    case responseCodes.Forbidden:
      return t("error.403_text");
    case responseCodes.Not_Found:
      return t("error.404_text");
    case responseCodes.Too_Many_Requests:
      return t("error.429_text");
    case responseCodes.Internal_Server_Error:
      return t("error.500_text");
    case responseCodes.Service_Unavailable:
      return t("error.503_text");
    default:
      return t("error.generic_text");
  }
});

const icon = computed(() => {
  switch (props.status) {
    case responseCodes.Unauthorized:
      return "arrow-left";
    case responseCodes.Forbidden:
      return "arrow-left";
    case responseCodes.Not_Found:
      return "arrow-left";
    case responseCodes.Too_Many_Requests:
      return "arrow-left";
    case responseCodes.Internal_Server_Error:
      return "refresh-cw-01";
    case responseCodes.Service_Unavailable:
      return "refresh-cw-01";
    default:
      return "arrow-left";
  }
});

const action = computed(() => {
  switch (props.status) {
    case responseCodes.Unauthorized:
      return t("action.back_to_shop");
    case responseCodes.Forbidden:
      return t("action.back_to_shop");
    case responseCodes.Not_Found:
      return t("action.back_to_shop");
    case responseCodes.Too_Many_Requests:
      return t("action.back_to_shop");
    case responseCodes.Internal_Server_Error:
      return t("action.reload_page");
    case responseCodes.Service_Unavailable:
      return t("action.reload_page");
    default:
      return t("action.back_to_shop");
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
    variant: "solid",
    color: "primary",
    icon: icon.value,
    label: action.value
  };

  return isNil(props.actions) ? [defaultAction] : props.actions;
});
</script>
