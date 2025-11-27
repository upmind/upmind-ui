<template>
  <UpmSection :label="t('text.phones')">
    <i18n-t keypath="text.phones_msg" tag="h1" />
    <UpmManage
      i18n-key="form.phone"
      v-model="defaultPhoneValue"
      :always-open="true"
      :manage="{
        useList: useClientPhones,
        useMutate: useClientPhoneManager
      }"
    >
      <template #item="{ item, readonly, doEdit, doRemove }">
        <PhoneItem
          v-bind="item"
          :readonly="readonly"
          @edit="doEdit"
          @remove="doRemove"
        />
      </template>
    </UpmManage>
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { ref } from "vue";

// --- internal
import {
  useClientPhones,
  useClientPhoneManager
} from "@upmind-automation/headless";

// --- components
import { UpmSection, UpmManage } from "@upmind-automation/client-vue";
import PhoneItem from "./PhoneItem.vue";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { isReady: getPhones, default: defaultPhone } = useClientPhones();

await getPhones();

const defaultPhoneValue = ref(defaultPhone()?.id);
</script>
