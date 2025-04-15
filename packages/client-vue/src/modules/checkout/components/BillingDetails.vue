<template>
  <section :class="styles.client.root" v-auto-animate>
    <header :class="styles.client.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <SkeletonList :class="styles.client.loading" v-if="meta.isLoading" />
    <!-- If we dont have any default or selected :- render a form for a new address -->
    <Item
      v-else-if="(meta.isAdding || meta.isEditing) && !open"
      :model-value="selected"
      :modal="meta.isEditing"
      :key="selected?.id"
      :color="color"
      i18nKey="unified"
      open
    />

    <!-- otherwise show the default address as a card -->
    <div :class="styles.client.content" v-else-if="selected">
      <h5 :class="styles.client.title">
        {{ t("client.title") }}

        <DropdownMenu v-if="!noActions" :items="actions" size="sm" />
      </h5>

      <Card
        i18nKey="unified"
        :model-value="selected"
        selected
        :selectable="false"
        no-actions
        :key="selected?.id"
      />

      <div :class="styles.client.actions">
        <!-- <Button
          :key="selected?.id"
          variant="tonal"
          :label="t('client.actions.convert')"
          size="xs"
          @click="onEdit"
          v-if="!selected?.state?.value?.context?.model?.companyDetails"
        /> -->
      </div>
    </div>

    <Listings
      :open="open"
      type="unified"
      i18nKey="unified"
      modal
      no-filter
      @update:open="onClose"
      :color="color"
    />

    <footer :class="styles.client.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { provide, ref, computed, watch, type ComputedRef } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useClientUnifiedAddress,
  useClientUnifiedAddresses,
} from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../checkout.config";

// --- components
import Item from "../../client/components/Item.vue";
import Card from "../../client/components/Card.vue";
import Listings from "../../client/Listings.vue";
import { SkeletonList, DropdownMenu } from "@upmind-automation/upmind-ui";

// --- utils
import { get, isEmpty } from "lodash-es";

// --- types
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
import type { BillingDetailsProps } from "../types";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "update:modelValue", payload: object): void;
}>();

const props = withDefaults(defineProps<BillingDetailsProps>(), {
  modelValue: () => ({}),
  color: "base",
});

const { t } = useI18n();
const client = useClientUnifiedAddresses();
const styles = useStyles(["client"], client.meta, config) as ComputedRef<{
  client: {
    root: string;
    header: string;
    loading: string;
    content: string;
    title: string;
    actions: string;
    footer: string;
  };
}>;
// ---

const { select, selected, getSelected, add, meta } = client;

// Provide the client to the form/card components
provide("client", useClientUnifiedAddress);

// ---
// check if we have a selected client, if we dont then we are creating a new one
getSelected().then(selected => {
  if (!selected) add();
});

const open = ref(false);

const actions = computed((): DropdownMenuItemProps[] => {
  return [
    // {
    //   label: t(
    //     "client.actions.edit",
    //     selected?.state?.value?.context?.model?.companyDetails ? 0 : 1
    //   ),
    //   handler: () => onEdit(),
    // },
    {
      label: t("client.actions.convert"),
      value: "convert",
      handler: () => onEdit(true),
      hidden: !!get(
        selected.value?.state?.value,
        "context.model.companyDetails"
      ),
    },
    {
      label: t("client.actions.change"),
      value: "change",
      handler: () => onChange(),
    },
  ];
});

function onChange() {
  open.value = true;
}

function onEdit(companyDetails = false) {
  const client = useClientUnifiedAddress(selected.value);
  const model = client.model.value;
  client.edit();
  // force the company details to be shown
  client.input({ ...model, companyDetails });
}
function onClose(value: boolean) {
  open.value = value;
}

watch(props, ({ modelValue: model }, { modelValue: oldModel }) => {
  const id = model?.companyId || model?.addressId;
  const oldId = oldModel?.companyId || oldModel?.addressId;

  if (id && id != oldId) select(id);
});

watch(selected, (value, oldValue) => {
  if (value?.id === oldValue?.id) return;
  const model = get(value?.state?.value, "context.model", {});
  if (isEmpty(model)) return;

  emit("update:modelValue", model);
});
</script>
