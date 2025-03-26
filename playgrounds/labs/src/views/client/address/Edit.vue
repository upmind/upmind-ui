<template>
  <pre>
    {{ model }}
  </pre>
  <Button @click="doUpdate">Update</Button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  useClientAddress,
  useClientAddresses,
} from "@upmind-automation/headless";

const { params } = useRoute();
const { isReady, getAll } = useClientAddresses();
const { update, input, getModel } = useClientAddress(params.id as string);

await getAll().then(isReady);

const model = ref(getModel());

function doUpdate() {
  input({
    ...getModel(),
    name: `New name ${Math.random()}`,
  });

  update();
}
</script>
