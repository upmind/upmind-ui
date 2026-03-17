<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :animatedIcon="animatedIcon"
      :actions="actions"
      :title="title"
      :text="text"
      data-testid="error"
    />
  </div>
</template>

<!-- Pre-load asset/chunk unavailable animations and icons at import time so they're cached and
     available even when asset URLs become stale after a deploy. -->
<script lang="ts">
import { loadAnimation, loadIcon } from "@upmind-automation/upmind-ui";
loadAnimation("refresh");
loadIcon("refresh-cw-01");
</script>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// -- components
import {
  Interstitial,
  type InterstitialActionProps
} from "@upmind-automation/upmind-ui";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { computed } from "vue";
import { first, isNil } from "lodash-es";
import { responseCodes, type Message } from "@upmind-automation/headless";
import type { StorefrontRoute } from "../../types";
const { t } = useI18n();

const props = withDefaults(
  defineProps<
    {
      title?: Message["title"];
      copy?: Message["copy"];
      actions?: Message["actions"];
      status?: Message["data"]["status"];
      storefrontRoute?: StorefrontRoute;
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

const emit = defineEmits<{
  dismiss: [];
}>();

const title = computed(() => {
  switch (props.status) {
    case 1000:
      return t("error.asset_unavailable_title_md");
    case responseCodes.No_Content:
      return props?.title ?? t("error.generic_title_md");
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
    case 1000:
      return t("error.asset_unavailable_text");
    case responseCodes.No_Content:
      return props?.copy ?? t("error.generic_text");
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
    case 1000:
      return "refresh-cw-01";
    case responseCodes.No_Content:
      return first(props?.actions)?.icon ?? "arrow-left";

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
    case 1000:
      return t("action.reload_page");
    case responseCodes.No_Content:
      return first(props?.actions)?.label ?? t("action.back_to_shop");

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
  icon:
    props.status === 1000
      ? "refresh"
      : (props.status ?? 0) >= 500
        ? "unavailable"
        : "error",
  trigger: props.animatedIcon.trigger,
  primaryColor: props.animatedIcon.primaryColor,
  secondaryColor: props.animatedIcon.secondaryColor,
  size: props.animatedIcon.size
}));

const actions = computed((): InterstitialActionProps[] => {
  let defaultAction: InterstitialActionProps;

  switch (props.status) {
    // for chunk/asset errors, reload to fetch fresh assets
    case 1000:
    // for service errors, we want to reload the page as its likely a temporary issue
    case responseCodes.Service_Unavailable:
    case responseCodes.Internal_Server_Error:
      defaultAction = {
        handler: () => window.location.reload(),
        variant: "solid",
        color: "primary",
        icon: icon.value,
        label: action.value
      };
      break;

    // for all other errors, we want to redirect back to the storefront
    default:
      defaultAction = {
        ...props.storefrontRoute,
        handler: () => emit("dismiss"),
        variant: "solid",
        color: "primary",
        icon: icon.value,
        label: action.value
      };
      break;
  }

  return isNil(props.actions) ? [defaultAction] : props.actions;
});
</script>
