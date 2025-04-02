<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    :title="`Edit Company ${id}`"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ model }}</pre>

      <div class="actions flex w-full basis-full gap-2">
        <Button @click="doInput" variant="tonal" :disabled="processing"
          >Change to random name</Button
        >
        <Button @click="doUpdate" :loading="processing">Update</Button>
      </div>
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { Button } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";
import {
  useClientCompany,
  useClientCompanies,
  type CompanyModel,
} from "@upmind-automation/headless";

const { isReady, getAll } = useClientCompanies();
await getAll().then(isReady);

const { params } = useRoute();
const { update, input, getModel } = useClientCompany(params.id as string);

const id = ref<string>(params.id as string);
const model = ref<CompanyModel>(getModel() ?? {});
const processing = ref<boolean>(false);

// --- METHODS

function doInput() {
  processing.value = true;
  input({
    ...model.value,
    name: `New name ${Math.random()}`,
  })
    .then((data: CompanyModel) => {
      model.value = data;
    })
    .catch(err => {
      console.error("error updating", { model, err });
    })
    .finally(() => {
      processing.value = false;
    });
}

function doUpdate() {
  processing.value = true;
  update()
    .then(res => {
      model.value = getModel();
    })
    .catch(err => {
      console.error("error updating", { model, err });
    })
    .finally(() => {
      processing.value = false;
    });
}
</script>
