<template>
  <DialogRoot :open="layout.visible">
    <DialogContent :close-label="t('action.close')" class="max-w-2xl">
      <DialogHeader v-if="layout.label">
        <DialogTitle>{{ layout.label }}</DialogTitle>
      </DialogHeader>
      <DispatchRenderer
        v-for="(element, index) in layout.uischema.elements"
        :key="index"
        :schema="layout.schema"
        :uischema="element"
        :path="layout.path"
        :enabled="layout.enabled"
        :renderers="layout.renderers"
        :cells="layout.cells"
      />
    </DialogContent>
  </DialogRoot>
</template>

<script setup lang="ts">
import { uiTypeIs } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout
} from "@jsonforms/vue";
import { useI18n } from "vue-i18n";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@upmind/ui";
import type { Layout } from "@jsonforms/core";
// -------------------------------------------------------------------

const { t } = useI18n();
const props = defineProps({
  ...rendererProps<Layout>()
});

const { layout } = useJsonFormsLayout(props);
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: uiTypeIs("Dialog")
};
</script>
