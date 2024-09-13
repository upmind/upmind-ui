// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwForm } from "@upmind/upwind";

// -- custom elements
import { UwDialog, UwButton, useCustomElement } from "@upmind/upwind";

useCustomElement(UwButton);
useCustomElement(UwDialog);

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
          const: 3,
        },
        {
          title: "I'm okay",
          const: 2,
        },
        {
          title: "I'm a beginner",
          const: 1,
        },
        {
          title: "I don't drive",
          const: 0,
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

const meta: Meta<typeof UwDialog> = {
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
    modelValue: false,
    persistent: false,
    title: "Proident id magna in velit",
    description:
      "Proident id proident ullamco veniam. Dolor duis anim sunt cillum exercitation occaecat aliqua consectetur proident incididunt amet. Laboris velit nostrud irure pariatur Lorem ad tempor aute laboris cillum ad sint.",
    size: "lg",
  },
};

export default meta;
type Story = StoryObj<typeof UwDialog>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    setup() {
      return {
        toggleOpen: () => {
          updateArgs({ modelValue: !args.modelValue });
        },
        onOpen: ({ detail }) => {
          const { isOpen = false } = first(detail);
          updateArgs({ modelValue: isOpen });
        },
        args,
      };
    },
    template: `
      <uw-dialog v-bind="args" @input="onOpen">
        <uw-button slot="trigger">Open Dialog</uw-button>
        <uw-button slot="close">Close</uw-button>
      </uw-dialog>
    `,
  }),
};

export const Hero: Story = {
  render: (args, { updateArgs }) => ({
    setup() {
      return {
        toggleOpen: () => {
          updateArgs({ modelValue: !args.modelValue });
        },
        onOpen: ({ detail }) => {
          const { isOpen = false } = first(detail);
          updateArgs({ modelValue: isOpen });
        },
        args,
      };
    },

    template: `
      <uw-button @click="toggleOpen">Open Dialog</uw-button>
      <uw-dialog
        v-bind="args"
        @input="onOpen"
        overflow="hidden"
      >
        <section  class="-m-6 -my-12 rounded-lg bg-white bg-cover bg-[url('https://upmind.com/assets/uploads/images/billboard/homepage.jpg?v=1644576569')]">
          <div class="grid px-4 py-8 mx-auto sm:gap-8 xl:gap-0 sm:py-16 sm:grid-cols-12" >
            <div class="px-4 flex flex-col gap-4 mr-auto place-self-center sm:col-span-6 md:col-span-5">
              <h2 class="mb-4 text-2xl">The <strong class="text-primary">billing</strong>, <strong class="text-primary">sales</strong> and <strong class="text-primary">automation</strong> platform for service businesses.</h2>
              <p class="mb-4">Upmind includes everything you need to successfully run and scale your online business.</p>

              <uw-button @click="toggleOpen" label="Get Started for free" appendIcon="arrow-right" :block="true"/>
            </div>
          </div>
        </section>
      </uw-dialog>
    `,
  }),
  args: {
    modelValue: true,
    title: "",
    description: "",
    size: "4xl",
  },
};

export const Form: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwForm },
    setup() {
      const model = ref({});
      const open = ref(false);

      const doUpdate = (value: boolean) => {
        open.value = value;
      };

      const toggleOpen = () => {
        updateArgs({ modelValue: !args.modelValue });
      };
      const onOpen = ({ detail }) => {
        const { isOpen = false } = first(detail);
        updateArgs({ modelValue: isOpen });
      };

      return {
        args,
        model,
        schema,
        open,
        doUpdate,
        toggleOpen,
        onOpen,
      };
    },
    methods: {},
    template: `
      <uw-button @click="toggleOpen">Open Dialog</uw-button>
      <uw-dialog v-bind="args" @input="onOpen">
        <upw-form
          :schema="schema"
          v-model="model"
          @resolve="doUpdate(false)"
          @reject="toggleOpen"
        />
      </uw-dialog>
    `,
  }),
  args: {
    title: "Nearly there",
    description: "We just need some details",
  },
};

export const ScrollableDialog: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwForm },
    setup() {
      const model = ref({});
      const open = ref(false);

      const doUpdate = (value: boolean) => {
        open.value = value;
      };

      const toggleOpen = () => {
        updateArgs({ modelValue: !args.modelValue });
      };
      const onOpen = ({ detail }) => {
        const { isOpen = false } = first(detail);
        updateArgs({ modelValue: isOpen });
      };

      return {
        args,
        model,
        combinedSchema,
        open,
        doUpdate,
        toggleOpen,
        onOpen,
      };
    },
    template: `
      <uw-button @click="toggleOpen">Open Dialog</uw-button>
      <uw-dialog
        v-bind="args"
        @input="onOpen"
      >
        <upw-form
          v-model="model"
          :schema="combinedSchema"
          noActions
          @resolve="doUpdate(false)"
          @reject="toggleOpen"
        />

        <div class="bg-gray-50 border cursor-pointer text-gray-600 mt-6 flex items-center justify-center select-none h-64 rounded-lg">
          Upload a profile picture
        </div>
        <uw-button class="mt-6" @click="toggleOpen" block>Save</uw-button>
        <uw-button class="mt-2" variant="ghost" @click="toggleOpen" block>Close</uw-button>
      </uw-dialog>
    `,
  }),
  args: {
    title: "Nearly there",
    description: "We just need some details",
  },
};

export const MockedAsyncAction: Story = {
  render: (args, { updateArgs }) => ({
    setup() {
      const loading = ref(false);
      let seconds = ref(3);

      const toggleOpen = () => {
        updateArgs({ modelValue: !args.modelValue });
      };
      const onOpen = ({ detail }) => {
        const { isOpen = false } = first(detail);
        updateArgs({ modelValue: isOpen });
      };

      const start = () => {
        loading.value = true;
        if (seconds.value === 1) {
          toggleOpen();
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
        open,
        args,
        start,
        toggleOpen,
        onOpen,
      };
    },
    template: `
      <uw-button @click="toggleOpen">Open Dialog</uw-button>
      <uw-dialog
        v-bind="args"
        @input="onOpen"
        title="Mocked asynchronous action"
        :description="seconds + ' seconds remaining'"
      >
        <uw-button slot="footer" size="sm" @click="start" :loading="loading">Begin</uw-button>
      </uw-dialog>
    `,
  }),
};
