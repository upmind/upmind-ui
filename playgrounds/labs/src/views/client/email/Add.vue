<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    class-content="gap-2 flex"
    title="New Email"
  >
    <UpmCard class="flex w-full flex-wrap gap-2 pb-3 md:pb-3">
      <pre>{{ model }}</pre>

      <div class="actions flex w-full basis-full gap-2">
        <Button
          @click="doInput"
          variant="tonal"
          :loading="inputting"
          :disabled="updating || inputting"
          label="Input Data"
        />
        <Button
          @click="doUpdate"
          :loading="updating"
          :disabled="updating || inputting"
          label="Update"
        />
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
import { type EmailModel, useClientEmail } from "@upmind-automation/headless";

const { update, input, getModel } = useClientEmail();

const model = ref<EmailModel>(getModel() ?? {});
const updating = ref<boolean>(false);
const inputting = ref<boolean>(false);

// --- METHODS

function doInput() {
  inputting.value = true;

  const data: EmailModel = {
    type: 1,
    email: faker.internet.email(),
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
      inputting.value = false;
    });
}

function doUpdate() {
  updating.value = true;
  update()
    .then(() => {
      model.value = getModel();
    })
    .catch(err => {
      console.error("error adding", { model, err });
    })
    .finally(() => (updating.value = false));
}
</script>
