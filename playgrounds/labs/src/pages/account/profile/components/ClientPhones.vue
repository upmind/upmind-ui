<template>
  <UpmSection :label="t('text.phones')">
    <i18n-t keypath="text.phones_msg" tag="h1" />
    <UpmManage
      i18n-key="form.phone"
      v-model="defaultPhoneValue"
      :force-open="true"
      :manage="{
        useList: useClientPhones,
        useMutate: useClientPhoneManager
      }"
    >
      <template #item="{ item, readonly, doEdit, doRemove, setDefault }">
        <PhoneItem
          v-bind="item"
          :readonly="readonly"
          @edit="doEdit"
          @remove="doRemove"
          @setDefault="setDefault"
        />
      </template>
    </UpmManage>
  </UpmSection>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { UpmSection, UpmManage } from "@upmind-automation/client-vue";
import {
  useClientPhones,
  useClientPhoneManager
} from "@upmind-automation/headless";
import PhoneItem from "./PhoneItem.vue";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { isReady, default: defaultPhone } = useClientPhones();

await isReady();
const defaultPhoneValue = ref(defaultPhone()?.id);
</script>
