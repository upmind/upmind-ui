<template>
  <div>
    <pre>{{ { selected, open, modelValue } }}</pre>

    <RadioCardsCollapsible
      v-if="!meta.isLoading && !meta.isEmpty"
      v-model:open="open"
      v-model="selected"
      :items="parsedAddresses"
      :list="false"
      required
    >
      <template #item="{ item }">
        <AddressItem v-bind="item" :readonly="props.readonly" />
      </template>

      <template #actions>
        <Link
          v-if="!open && parsedAddresses.length > 1"
          :label="t('billing.actions.change')"
          size="xs"
          variant="muted"
          @click="open = true"
        />

        <Link
          v-else-if="!readonly"
          :label="
            t('billing.actions.add', { type: UnifiedAddressType.PERSONAL })
          "
          size="xs"
          variant="muted"
          @click="openModel = true"
        />
      </template>
    </RadioCardsCollapsible>

    <!-- phone  -->
    <RadioCardsCollapsible
      v-if="!phoneMeta.isLoading && !phoneMeta.isEmpty"
      v-model:open="open"
      v-model="selectedPhone"
      :items="parsedPhones"
      :list="false"
      minimal
      required
    >
      <template #item="{ item }">
        <PhoneItem v-bind="item.phone" :readonly="props.readonly" />
      </template>

      <template #actions>
        <Link
          v-if="!open && parsedAddresses.length > 1"
          :label="t('client.phone.actions.change')"
          size="xs"
          variant="muted"
          @click="open = true"
        />

        <Link
          v-else-if="!readonly"
          :label="t('client.phone.actions.add')"
          size="xs"
          variant="muted"
          @click="openModel = true"
        />
      </template>
    </RadioCardsCollapsible>

    <Add
      v-if="(!meta.isLoading && meta.isEmpty) || openModel"
      v-model:open="openModel"
      :modal="!meta.isEmpty"
      :type="UnifiedAddressType.PERSONAL"
      @resolve="doResolve"
      @reject="doReject"
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useClientAddresses,
  useClientPhones,
  UnifiedAddressType,
} from "@upmind-automation/headless";

// --- components
import { RadioCardsCollapsible, Link } from "@upmind-automation/upmind-ui";
import Add from "./Add.vue";
import PhoneItem from "./components/PhoneItem.vue";
import AddressItem from "./components/AddressItem.vue";

// --- utils
import { find, map, set } from "lodash-es";

// --- types

import type { BillingModel } from "@upmind-automation/headless";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import { useVModel } from "@vueuse/core";

// -----------------------------------------------------------------------------

const props = defineProps<{
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const { t } = useI18n();

// -----------------------------------------------------------------------------

const {
  data: addresses,
  meta,
  default: defaultAddress,
  isReady: isAddressesReady,
} = useClientAddresses();

const {
  data: phones,
  meta: phoneMeta,
  default: defaultPhone,
  isReady: isPhonesReady,
} = useClientPhones();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  deep: true,
  defaultValue: {
    addressId: defaultAddress.value?.id,
    phoneId: defaultPhone.value?.id,
  },
});

await Promise.all([isAddressesReady, isPhonesReady]).then(() => {
  // Ensure modelValue is initialized with default values
  modelValue.value ??= {
    addressId: defaultAddress.value?.id,
    phoneId: defaultPhone.value?.id,
  };
});

// -----------------------------------------------------------------------------
const open = ref(false);
const openModel = ref(meta.value.isEmpty);
const editId = ref<string>("");

const selected = computed({
  get() {
    return modelValue.value?.addressId ?? undefined;
  },
  set(val: string) {
    debugger;
    modelValue.value ??= {};
    debugger;
    const found = find(addresses.value, { id: val });
    if (found) {
      set(modelValue.value, "addressId", found.id);
    } else {
      console.warn("Company not found for id:", val);
    }
  },
});

const selectedPhone = computed({
  get() {
    return modelValue.value?.phoneId ?? undefined;
  },
  set(val: string) {
    debugger;
    modelValue.value ??= {};
    debugger;
    const found = find(phones.value, { id: val });
    if (found) {
      set(modelValue.value, "phoneId", found.id);
    } else {
      console.warn("Phone not found for id:", val);
    }
  },
});

const parsedAddresses = computed(() => {
  return map(addresses.value || [], (item: any, index: number) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      item: item,
      index: index,
      // modelValue: modelValue.value,
    };
  }) as RadioCardsItemProps[];
});

const parsedPhones = computed(() => {
  return map(phones.value || [], (item: any, index: number) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      item: item,
      index: index,
      // modelValue: modelValue.value,
    };
  }) as RadioCardsItemProps[];
});

function doReject() {
  openModel.value = false;
  editId.value = "";
}

function doResolve(value: BillingModel) {
  modelValue.value = value;
  openModel.value = false;
  editId.value = "";
}
</script>
