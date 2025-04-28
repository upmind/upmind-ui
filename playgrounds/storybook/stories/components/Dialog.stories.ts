// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Dialog, Button, Form } from "@upmind-automation/upmind-ui";

// --- utils
import { keys, first } from "lodash-es";

// --- types
// useArgTypes doesn't go above 2xl
enum sizes {
  "auto" = "auto",
  "sm" = "sm",
  "md" = "md",
  "lg" = "lg",
  "xl" = "xl",
  "2xl" = "2xl",
  "3xl" = "3xl",
  "4xl" = "4xl",
}

const schema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 3,
      title: "What is your name?",
      description: "Please enter your full name",
      i18n: "form.name",
    },
    dob: {
      type: "string",
      format: "date",
      title: "What is your date of birth?",
      i18n: "form.dob",
    },
    postalCode: {
      type: "string",
      maxLength: 5,
      title: "What is your postal/zip code?",
      i18n: "form.postalCode",
    },
  },
  required: ["name", "dob", "postalCode"],
};

const extendedSchema = {
  type: "object",
  properties: {
    nationality: {
      type: "string",
      minLength: 3,
      title: "What is your nationality?",
      description: "Please enter your nationality",
      i18n: "form.nationality",
    },
    occupation: {
      type: "string",
      minLength: 3,
      title: "What is your occupation?",
      description: "Please enter your occupation",
      i18n: "form.occupation",
    },
    drivingSkill: {
      type: "number",
      title: "How good are you at driving?",
      i18n: "form.drivingSkill",
      oneOf: [
        {
          title: "I'm a pro",
          const: "3",
        },
        {
          title: "I'm okay",
          const: "2",
        },
        {
          title: "I'm a beginner",
          const: "1",
        },
        {
          title: "I don't drive",
          const: "0",
        },
      ],
    },
  },
  required: ["name", "dob", "postalCode"],
};

const combinedSchema = {
  type: "object",
  properties: {
    ...schema.properties,
    ...extendedSchema.properties,
  },
  required: Array.from(
    new Set([...schema.required, ...extendedSchema.required])
  ),
};
// -----------------------------------------------------------------------------

const meta: Meta<typeof Dialog> = {
  component: Dialog,
  argTypes: {
    size: {
      options: keys(sizes),
      control: {
        type: "radio",
        labels: sizes,
      },
    },
  },
  args: {
    open: false,
    dismissable: true,
    title: "Proident id magna in velit",
    description:
      "Proident id proident ullamco veniam. Dolor duis anim sunt cillum exercitation occaecat aliqua consectetur proident incididunt amet. Laboris velit nostrud irure pariatur Lorem ad tempor aute laboris cillum ad sint.",
    size: "sm",
  },
  parameters: {
    docs: {
      description: {
        component:
          "A modal window that appears in front of the main content to provide information or request user input.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { Button, Dialog },
    setup() {
      return {
        toggleOpen: () => {
          updateArgs({ open: !args.open });
        },
        args,
      };
    },
    template: `
      <Dialog v-bind="args" @update:open="toggleOpen">
        <template v-slot:trigger>
          <Button @click="toggleOpen">Open Dialog</Button>
        </template>
        <template v-slot:close>
          Close
        </template>
      </Dialog>
    `,
  }),
};

export const Hero: Story = {
  render: (args, { updateArgs }) => ({
    components: { Button, Dialog },

    setup() {
      return {
        toggleOpen: () => {
          updateArgs({ open: !args.open });
        },
        onOpen: ({ detail }: { detail: [{ isOpen: boolean }] }) => {
          const { isOpen = false } = first(detail);
          updateArgs({ open: isOpen });
        },
        args,
      };
    },

    template: `
      <Dialog
        v-bind="args"
        :open="args.open"
        overflow="hidden"
        fit="cover"
      >
        <template #trigger>
          <Button @click="toggleOpen">Open Dialog</Button>
        </template>

        <section class="rounded-lg bg-gradient-to-br from-primary-400 to-primary-200 px-12 py-8 mx-auto sm:py-16">
          <div class="grid sm:gap-8 xl:gap-0 sm:grid-cols-12">
            <div class="flex flex-col gap-4 mr-auto place-self-center sm:col-span-6">
              <h2 class="text-2xl">The <strong class="text-primary">billing</strong>, <strong class="text-primary">sales</strong> and <strong class="text-primary">automation</strong> platform for service businesses.</h2>
              <p class="mb-12">Upmind includes everything you need to successfully run and scale your online business.</p>
            </div>
          </div>

            <Button @click="toggleOpen">Close Dialog</Button>
        </section>
      </Dialog>
    `,
  }),
  args: {
    open: true,
    title: "",
    description: "",
    size: "4xl",
  },
};

export const DialogForm: Story = {
  render: (args, { updateArgs }) => ({
    components: { Dialog, Form, Button },
    setup() {
      const model = ref({});
      const open = ref(false);
      return {
        args,
        model,
        schema,
        open,
      };
    },
    methods: {},
    template: `
      <Dialog v-bind="args" v-model:open="open">
        <template v-slot:trigger>
          <Button size="md">Open Dialog</Button>
        </template>

        <Form
          :schema="schema"
          v-model="model"
          @resolve="open = false"
          @reject="open = false"
        />
      </Dialog>
    `,
  }),
  args: {
    title: "Nearly there",
    description: "We just need some details",
  },
};

export const ScrollableDialog: Story = {
  render: args => ({
    components: { Dialog, Button, Form },
    setup() {
      const model = ref({});
      const open = ref(false);

      return {
        args,
        model,
        combinedSchema,
        open,
        toggleOpen: () => {
          open.value = !open.value;
        },
      };
    },
    template: `
      <Dialog v-bind="args" v-model:open="open">
        <template v-slot:trigger>
          <Button size="md">Open Dialog</Button>
        </template>

        <Form
          v-model="model"
          :schema="combinedSchema"
          noActions
          @resolve="doUpdate(false)"
          @reject="toggleOpen"
        />

        <div class="bg-gray-50 border cursor-pointer text-gray-600 mt-6 flex items-center justify-center select-none h-64 rounded-lg">
          Upload a profile picture
        </div>

        <template v-slot:footer>
          <Button class="mt-6" @click="toggleOpen" block>Save</Button>
        </template>

        <template v-slot:close>
          <Button class="mt-2" variant="ghost" block>Close</Button>
        </template>
      </Dialog>
    `,
  }),
  args: {
    title: "Nearly there",
    description: "We just need some details",
    size: "xl",
  },
};

export const MockedAsyncAction: Story = {
  render: args => ({
    components: { Dialog, Button },
    setup() {
      const open = ref(false);
      const loading = ref(false);
      let seconds = ref(3);

      const start = () => {
        loading.value = true;
        if (seconds.value === 1) {
          open.value = false;
          loading.value = false;
          seconds.value = 3;
        } else {
          seconds.value--;
          setTimeout(() => {
            start();
          }, 1000);
        }
      };

      return {
        seconds,
        loading,
        args,
        start,
        open,
      };
    },
    template: `
      <Dialog
        v-bind="args"
        v-model:open="open"
        title="Mocked asynchronous action"
        :description="seconds + ' seconds remaining'"
      >
        <template v-slot:trigger>
          <Button @click="toggleOpen" size="md">Open Dialog</Button>
        </template>
        <Button slot="footer" size="sm" @click="start" :loading="loading">Begin</Button>
      </Dialog>
    `,
  }),
};
