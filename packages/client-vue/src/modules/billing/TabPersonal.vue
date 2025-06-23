<template>
  <div>
    <pre>{{ { selected, open, modelValue } }}</pre>

    <!-- address vs company -->
    <RadioCardsCollapsible
      v-if="!meta.isLoading && !meta.isEmpty"
      v-model:open="open"
      v-model="selected"
      :items="parsedValues"
      :list="false"
      required
    >
      <template #item="{ item }">
        <AddressItem v-bind="item" :readonly="props.readonly" />
      </template>

      <template #actions>
        <Link
          v-if="!open && parsedValues.length > 1"
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
          v-if="!open && parsedValues.length > 1"
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
      :client-id="props.clientId"
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
  useClientCompanies,
  useClientPhones,
  UnifiedAddressType,
} from "@upmind-automation/headless";

// --- components
import { RadioCardsCollapsible, Link } from "@upmind-automation/upmind-ui";
import Add from "./Add.vue";
import PhoneItem from "../client/phone/Item.vue";
import AddressItem from "../client/address/Item.vue";
import CompanyItem from "../client/company/Item.vue";

// --- utils
import { first, lowerCase, map, set, find } from "lodash-es";

// --- types

import type { BillingModel, Company } from "@upmind-automation/headless";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import { useVModel } from "@vueuse/core";

// -----------------------------------------------------------------------------

const props = defineProps<{
  clientId: string;
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------
const { data, meta, default: defaultItem } = useClientCompanies();

const {
  data: phones,
  meta: phoneMeta,
  default: defaultPhone,
} = useClientPhones();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
});

// -----------------------------------------------------------------------------
const open = ref(false);
const openModel = ref(meta.value.isEmpty);
const editId = ref<string>("");

const selected = computed({
  get() {
    return (
      modelValue.value?.companyId ||
      modelValue.value?.addressId ||
      modelValue.value?.phoneId ||
      defaultItem.value?.id
    );
  },
  set(val: string) {
    modelValue.value = {
      addressId: val,
    };
  },
});

const selectedPhone = computed({
  get() {
    return modelValue.value?.phoneId || defaultPhone.value?.id;
  },
  set(val: string) {
    debugger;
    modelValue.value ??= {};
    debugger;
    set(modelValue.value, "phoneId", val);
  },
});

const parsedValues = computed(() => {
  return map(data.value || [], (item: any, index: number) => {
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
