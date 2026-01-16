<template>
  <Upm />
</template>

<script lang="ts" setup>
import { watch } from "vue";
import { useRouter } from "vue-router";
import { useSession } from "@upmind-automation/headless";
import { Upm } from "@upmind-automation/client-vue";
import { ROUTE } from "./router";

const router = useRouter();
const { meta } = useSession();
</script>
