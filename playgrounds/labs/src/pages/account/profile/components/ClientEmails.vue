<template>
  <UpmSection :label="t('text.emails')">
    <i18n-t keypath="text.emails_msg" tag="h1" />
    <UpmManage
      i18n-key="form.email"
      v-model="defaultEmailValue"
      :force-open="true"
      :manage="{
        useList: useClientEmails,
        useMutate: useClientEmailManager
      }"
    >
      <template #item="{ item, readonly, doEdit, doRemove, setDefault }">
        <EmailItem
          v-bind="item"
          :readonly="readonly"
          @edit="doEdit"
          @remove="doRemove"
          @verify="verify"
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
  useClientEmails,
  useClientEmailManager
} from "@upmind-automation/headless";
import EmailItem from "./EmailItem.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const { isReady, default: defaultEmail, verify } = useClientEmails();

await isReady();

const defaultEmailValue = ref(defaultEmail()?.id);
</script>
