<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Drawer : Section"
    title="Change address"
    :open="isOpen"
    @reject="onClose"
    @update:open="onClose"
    :skrim="skrim"
    :class="styles.clientListings.root"
    :class-footer="styles.clientListings.footer"
    v-auto-animate
    size="2xl"
  >
    <template #header>
      <slot name="header" v-bind="{ meta }"></slot>
    </template>

    <div v-if="!meta.isAvailable">
      <Auth no-tabs />
    </div>

    <SkeletonList
      :class="styles.clientListings.loading"
      v-else-if="meta.isLoading"
    />

    <template v-else>
      <Input
        v-if="!noFilter && meta.canFilter"
        @input="filter($event?.currentTarget?.value)"
        :placeholder="t(`client.${type}.actions.filter`)"
        size="sm"
      />

      <div :class="styles.clientListings.items">
        <Card
          v-for="item in sortedItems"
          :key="item.id"
          :model-value="item"
          :selected="item.id === selected?.id"
          :hidden="meta.isAdding && item.id === selected?.id"
          :disabled="meta.isEditing && item.id === selected?.id"
          :i18nKey="i18nKey"
          :no-actions="noActions"
          @update:modelValue="onSelect"
          @click:action="onClose"
        />
      </div>

      <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty">
        <Empty :i18nKey="type" />
      </slot>

      <Item
        v-if="meta.isEditing || meta.isAdding"
        :model-value="selected"
        :key="selected?.id"
        :i18nKey="i18nKey"
        @reject="onClose"
        :color="color"
        open
        nested
      />

      <div
        :class="styles.clientListings.actions"
        v-if="!meta.isAdding && !meta.isEditing && !meta.isLoading && !modal"
      >
        <Button
          :label="t(`client.${type}.actions.add`)"
          variant="link"
          @click="add"
          block
        />
      </div>
    </template>

    <template #footer>
      <slot name="footer" v-bind="{ meta }"></slot>
    </template>

    <template #actions>
      <Button
        v-for="(action, key) in actions"
        :key="key"
        v-bind="action"
        :loading="action.loading"
        :disabled="action?.disabled"
        @click="doAction(action)"
        :color="action.color"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed, provide, ref, type ComputedRef } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useClientEmails,
  useClientEmail,
  useClientPhones,
  useClientPhone,
  useClientAddresses,
  useClientAddress,
  useClientCompanies,
  useClientCompany,
  useClientUnifiedAddresses,
  useClientUnifiedAddress,
} from "@upmind-automation/headless-vue";
import {
  useStyles,
  type ButtonProps,
  type FormActionProps,
} from "@upmind-automation/upmind-ui";
import config from "../client/client.config";

// --- components
import Section from "../Section.vue";
import Auth from "../session/AuthTabs.vue";
import Empty from "./Empty.vue";
import Card from "./Card.vue";
import Item from "./Item.vue";
import { Input, SkeletonList } from "@upmind-automation/upmind-ui";

// --- custom elements
import { Button, Drawer } from "@upmind-automation/upmind-ui";

// --- utils
import { isFunction } from "lodash-es";

// ---types
import type { ActorRef } from "xstate";
import { type ClientComposables } from "@upmind-automation/headless-vue";
// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "update:open", payload: boolean): void;
}>();

const props = withDefaults(
  defineProps<{
    type: string;
    i18nKey: string;
    open?: boolean;
    modal?: boolean;
    color?: ButtonProps["color"];
    skrim?: string;
    noActions?: boolean;
    noFilter?: boolean;
    cols?: string | number;
  }>(),
  {
    open: false,
    modal: false,
    color: "base",
    skrim: "dark",
    noActions: false,
    noFilter: false,
    cols: 1,
  }
);

const { t } = useI18n();

let clientListings: ClientComposables["useClientListing"],
  client: ClientComposables["useClientItem"];

switch (props.type) {
  case "addresses":
    clientListings = useClientAddresses;
    client = useClientAddress;
    break;
  case "emails":
    clientListings = useClientEmails;
    client = useClientEmail;
    break;
  case "phones":
    clientListings = useClientPhones;
    client = useClientPhone;
    break;
  case "companies":
    clientListings = useClientCompanies;
    client = useClientCompany;
    break;

  default:
  case "unified":
    clientListings = useClientUnifiedAddresses;
    client = useClientUnifiedAddress;
    break;
}

const { select, selected, items, isReady, add, meta, filter } =
  clientListings();

const styles = useStyles(["clientListings"], meta, config) as ComputedRef<{
  clientListings: {
    root: string;
    items: string;
    loading: string;
    actions: string;
    footer: string;
  };
}>;

// provide the correct composable to our child components
provide("client", client);

const active = ref(selected.value);

// safetycheck to ensure we have a selected item
isReady().then(() => (active.value = selected.value));

const actions = computed((): Record<string, FormActionProps> => {
  return {
    add: {
      label: t(`client.${props.type}.actions.add`),
      variant: "link",
      color: props.color,
      block: true,
      handler: () => {
        add();
      },
    },
    confirm: {
      label: t(`client.${props.type}.actions.confirm`),
      variant: "flat",
      color: props.color,
      block: true,
      handler: () => {
        onClose(true);
      },
    },
  };
});

const sortedItems = computed(() => {
  // if we may have an active 'selected', and we want to sort the items so that the selected item is always on top
  // we dont do this to the  reactive 'selected' to prevent jank re-ordering
  // we use the inital value as opposed to the reactive value
  return [...items.value].sort(
    (x: ActorRef<any, any>, y: ActorRef<any, any>) =>
      x.id == active.value?.id ? -1 : y.id == active.value?.id ? 1 : 0
  );
});
const isOpen = computed(() => {
  return open;
});

function onClose(value: boolean) {
  emit("update:open", value);
}

function onSelect(item: ActorRef<any, any>) {
  select(item.id);
  emit("update:open", false);
}
function doAction(item: FormActionProps) {
  if (isFunction(item?.handler)) {
    item.handler();
  }
}
</script>
