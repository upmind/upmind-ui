<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    title="New Company"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre> {{ model }}</pre>

      <div class="actions flex w-full basis-full gap-2">
        <Button
          @click="doInput"
          variant="tonal"
          :disabled="processing"
          label="Input Data"
        />
        <Button @click="doUpdate" :loading="processing" label="Update" />
      </div>
    </UpmCard>

    <template #footer> </template>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { faker } from "@faker-js/faker";
import { Button } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";
import {
  useClientCompany,
  type CompanyModel,
} from "@upmind-automation/headless";

const { update, input, getModel } = useClientCompany();

const model = ref<CompanyModel>(getModel() ?? {});
const processing = ref<boolean>(false);

// --- METHODS

function doInput() {
  processing.value = true;

  const data: CompanyModel = {
    name: faker.company.name(),
    vatNumber: faker.string.numeric(9),
    addressId: model.value.addressId,
    emailId: model.value.emailId,
    phoneId: model.value.phoneId,
    regNumber: faker.string.ulid(),
    default: false,
  };

  console.log(data);

  input(data)
    .then(data => {
      model.value = data;
    })
    .catch(err => {
      console.error("error inputting", { model, err });
    })
    .finally(() => {
      processing.value = false;
    });
}

function doUpdate() {
  processing.value = true;
  update()
    .then(() => {
      model.value = getModel();
    })
    .catch(err => {
      console.error("error adding", { model, err });
    })
    .finally(() => (processing.value = false));
}
</script>
