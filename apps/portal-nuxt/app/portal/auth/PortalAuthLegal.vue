<template>
  <Markdown
    v-if="footerTemplate?.body"
    tag="div"
    :model-value="footerTemplate.body"
    :class="AUTH_FOOTER_PROSE_CLASS"
  />
</template>

<script setup lang="ts">
import { Markdown } from "@upmind/ui";
import {
  ClientTemplateSlotCodes,
  useBrand,
  useClientTemplate
} from "@upmind-automation/headless";
import { AUTH_FOOTER_PROSE_CLASS } from "~/portal/shell/variants";

const { brandId } = useBrand();
const { data: footerTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.FOOTER,
  objectId: brandId.value
});
</script>
