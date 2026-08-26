<template>
  <div class="flex grow items-center justify-center">
    <!-- dataAttrs, not fallthrough: in modal mode the root is a renderless
         DialogRoot, which drops a fallthrough attribute entirely. -->
    <Interstitial
      :close-label="t('action.close')"
      :open="props.open"
      :modal="props.modal"
      :animated-icon="animatedIcon"
      :title="title"
      :text="text"
      :data-attrs="{ 'data-test-key': 'error' }"
    >
      <template #actions>
        <Button
          v-for="(item, index) in actions"
          :key="index"
          v-bind="useTestAttrs({ key: 'interstitial-action', value: index })"
          variant="primary"
          size="lg"
          @click="runAction(item)"
        >
          <Icon v-if="item.icon" :icon="item.icon" />
          {{ item.label }}
        </Button>
      </template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
import {
  Interstitial,
  Button,
  loadAnimation,
  useTestAttrs,
  type InterstitialAnimatedIcon
} from "@upmind/ui";
import { computed, onBeforeMount } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { responseCodes, type Message } from "@upmind-automation/headless";
import { Icon } from "../../components/icon";
import { first, isNil } from "lodash-es";
import type { StorefrontRoute } from "../../types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

/** A user action rendered as a Button in the error interstitial. */
type ErrorAction = {
  handler?: ((...args: unknown[]) => unknown) | string;
  icon?: string;
  label?: string;
  to?: RouteLocationAsRelativeGeneric;
  href?: string;
};
// -----------------------------------------------------------------------------

const { t } = useI18n();
const router = useRouter();

// Pre-cache the error animations so they stay available even when asset URLs
// go stale after a deploy (this is the page shown when things fail). Action
// icons are lucide components bundled in JS, so they need no preload.
onBeforeMount(() => {
  loadAnimation("error");
  loadAnimation("unavailable");
  loadAnimation("refresh");
});

const props = withDefaults(
  defineProps<{
    title?: Message["title"];
    copy?: Message["copy"];
    actions?: Message["actions"];
    status?: Message["data"]["status"];
    storefrontRoute?: StorefrontRoute;
    open?: boolean;
    modal?: boolean;
  }>(),
  {
    open: true,
    modal: true
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

const animatedIcon = computed<InterstitialAnimatedIcon>(() => ({
  icon:
    props.status === 1000
      ? "refresh"
      : (props.status ?? 0) >= 500
        ? "unavailable"
        : "error",
  size: "xl"
}));

const actions = computed((): ErrorAction[] => {
  let defaultAction: ErrorAction;

  switch (props.status) {
    // chunk/asset + service/server errors: reload to fetch fresh assets
    case 1000:
    case responseCodes.Service_Unavailable:
    case responseCodes.Internal_Server_Error:
      defaultAction = {
        handler: () => window.location.reload(),
        icon: icon.value,
        label: action.value
      };
      break;

    // everything else: back to the storefront
    default:
      defaultAction = {
        ...props.storefrontRoute,
        handler: () => emit("dismiss"),
        icon: icon.value,
        label: action.value
      };
      break;
  }

  return isNil(props.actions) ? [defaultAction] : props.actions;
});

// Run an action's handler then follow its route — mirrors the old Interstitial,
// which bound to/href on the Button (nav) plus a click handler (dismiss/reload).
function runAction(item: ErrorAction) {
  if (typeof item.handler === "function") item.handler();
  if (item.to) router.push(item.to);
  else if (item.href) window.location.href = item.href;
}
</script>
