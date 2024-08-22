// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import {
  UwDialogConsolidated,
  UwDialogClose,
  UwButton,
  UpwForm,
} from "@upmind/upwind";

// --- utils
import { keys } from "lodash-es";

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

const meta: Meta<typeof UwDialogConsolidated> = {
  component: UwDialogConsolidated,
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
    title: "Proident id magna in velit",
    description:
      "Proident id proident ullamco veniam. Dolor duis anim sunt cillum exercitation occaecat aliqua consectetur proident incididunt amet. Laboris velit nostrud irure pariatur Lorem ad tempor aute laboris cillum ad sint.",
    size: "lg",
  },
};

export default meta;
type Story = StoryObj<typeof UwDialogConsolidated>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UwDialogConsolidated, UwDialogClose, UwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <UwDialogConsolidated v-bind="args">
        <template v-slot:trigger>
          <uw-button>Open Dialog</up-button>
        </template>

        <template v-slot:footer>
          <uw-dialog-close>
            <uw-button size="sm">Close</up-button>
          </uw-dialog-close>
        </template>
      </UwDialogConsolidated>
    `,
  }),
};

export const Hero: Story = {
  render: args => ({
    components: { UwDialogConsolidated, UwDialogClose, UwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <UwDialogConsolidated v-bind="args" overflow="hidden">
        <template v-slot:trigger>
          <uw-button>Open Dialog</uw-button>
        </template>

        <template v-slot:content>
          <section class="-m-6 -my-12 rounded-lg bg-white bg-cover bg-[url('https://upmind.com/assets/uploads/images/billboard/homepage.jpg?v=1644576569')]">
            <div class="grid px-4 py-8 mx-auto sm:gap-8 xl:gap-0 sm:py-16 sm:grid-cols-12" >
              <div class="px-4 flex flex-col gap-4 mr-auto place-self-center sm:col-span-6 md:col-span-5">
                <h2 class="mb-4 text-2xl">The <strong class="text-primary">billing</strong>, <strong class="text-primary">sales</strong> and <strong class="text-primary">automation</strong> platform for service businesses.</h2>
                <p class="mb-4">Upmind includes everything you need to successfully run and scale your online business.</p>
                <uw-dialog-close>
                  <uw-button label="Get Started for free" appendIcon="arrow-right" :block="true"/>
                </uw-dialog-close>
              </div>
            </div>
          </section>
        </template>
      </UwDialogConsolidated>
    `,
  }),
  args: {
    title: null,
    description: null,
    size: "4xl",
  },
};

export const Form: Story = {
  render: args => ({
    components: { UwDialogConsolidated, UwButton, UpwForm },
    setup() {
      const model = ref({});
      const open = ref(false);

      const doUpdate = (value: boolean) => {
        open.value = value;
      };

      return {
        args,
        model,
        schema,
        open,
        doUpdate,
      };
    },
    methods: {},
    template: `
      <UwDialogConsolidated v-bind="args" v-model:open="open">
        <template v-slot:trigger>
          <uw-button>Open Dialog</uw-button>
        </template>

        <template v-slot:content>
          <upw-form
            :schema="schema"
            v-model="model"
            @resolve="doUpdate(false)"
            @reject="doUpdate(false)"
          />
        </template>
      </UwDialogConsolidated>
    `,
  }),
  args: {
    title: "Nearly there",
    description: "We just need some details",
  },
};

export const ScrollableDialog: Story = {
  render: args => ({
    components: { UwDialogConsolidated, UwDialogClose, UwButton, UpwForm },
    setup() {
      const model = ref({});
      const open = ref(false);

      const doUpdate = (value: boolean) => {
        open.value = value;
      };

      return {
        args,
        model,
        combinedSchema,
        open,
        doUpdate,
      };
    },
    template: `
      <UwDialogConsolidated
        v-model:open="open"
        v-bind="args"
      >
        <template v-slot:trigger>
          <uw-button>Open Dialog</uw-button>
        </template>

        <template v-slot:content>
          <div class="py-4">
            <upw-form
              :schema="combinedSchema"
              :noActions="true"
              v-model="model"
            />

            <div class="bg-gray-50 border cursor-pointer text-gray-600 mt-6 flex items-center justify-center select-none h-64 rounded-lg">
              Upload a profile picture
            </div>
          </div>
        </template>

        <template v-slot:footer>
          <uw-dialog-close>
            <uw-button label="Close":block="true"/>
          </uw-dialog-close>
        </template>
      </UwDialogConsolidated>
    `,
  }),
  args: {
    title: "Nearly there",
    description: "We just need some details",
  },
};

export const MockedAsyncAction: Story = {
  render: args => ({
    components: { UwDialogConsolidated, UwDialogClose, UwButton },
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
        open,
        args,
        start,
      };
    },
    template: `
      <UwDialogConsolidated v-model:open="open" title="Mocked asynchronous action" :description="seconds + ' seconds remaining'">
        <template v-slot:trigger>
          <uw-button>Open Dialog</uw-button>
        </template>

        <template v-slot:footer>
            <uw-button size="sm" @click="start" :loading="loading">Begin</uw-button>
        </template>
      </UwDialogConsolidated>
    `,
  }),
};
