// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwDialog, UpwButton, UpwForm } from "@upmind/upwind";

// --- utils
import { keys } from "lodash-es";

// --- types
enum skrims {
  none = "none",
  dark = "dark",
  light = "light",
  normal = "normal",
  primary = "primary",
  secondary = "secondary",
  accent = "accent",
  neutral = "neutral",
  success = "success",
  error = "error",
  warning = "warning",
  info = "info",
}
// -----------------------------------------------------------------------------

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
// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwDialog> = {
  component: UpwDialog,
  argTypes: {
    skrim: {
      options: keys(skrims),
      control: {
        labels: skrims,
      },
    },
  },
  args: {
    title: "Proident id magna in velit",
    text: "Proident id proident ullamco veniam. Dolor duis anim sunt cillum exercitation occaecat aliqua consectetur proident incididunt amet. Laboris velit nostrud irure pariatur Lorem ad tempor aute laboris cillum ad sint.",
    // data: `Tempor minim ad pariatur occaecat ut. Pariatur sit consectetur commodo eiusmod esse qui consequat. Veniam elit est reprehenderit cupidatat aute id ex voluptate anim duis aliquip.\n\n
    // Anim nulla et sit elit irure cupidatat ullamco commodo mollit id. Anim voluptate aliquip enim magna elit ea irure non in minim. Culpa aliquip veniam qui aliqua amet fugiat. Voluptate dolor esse id do ea aute amet culpa fugiat aliqua ipsum. Laborum laborum esse esse nulla sunt labore nostrud officia ea irure aute. Consequat dolore Lorem esse pariatur sunt magna sint qui aliquip culpa fugiat in ut adipisicing. Est esse irure esse sunt nisi nisi ex irure fugiat non.`,
    // ---
    modelValue: true,
    skrim: "normal",
  },
};

export default meta;
type Story = StoryObj<typeof UpwDialog>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwDialog, UpwButton },
    setup() {
      return {
        args,
      };
    },
    methods: {
      doUpdate(value: boolean) {
        updateArgs({ modelValue: value });
      },
    },
    template: `
        <upw-button variant="ghost" block @click="doUpdate(true)">Open Dialog</upw-button>
        <upw-dialog v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

export const Hero: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwDialog, UpwButton },
    setup() {
      return {
        args,
      };
    },
    methods: {
      doUpdate(value: boolean) {
        updateArgs({ modelValue: value });
      },
    },
    template: `
        <upw-button variant="ghost" block @click="doUpdate(true)">Open Dialog</upw-button>
        <upw-dialog v-bind="args" @update:modelValue="doUpdate">
          <section class="-m-6  bg-white bg-cover bg-[url('https://upmind.com/assets/uploads/images/billboard/homepage.jpg?v=1644576569')]">
              <div class="grid px-4 py-8 mx-auto sm:gap-8 xl:gap-0 sm:py-16 sm:grid-cols-12" >

                  <div class="px-4 flex flex-col gap-4 mr-auto place-self-center sm:col-span-6 md:col-span-5">
                      <h2 class="mb-4 text-2xl">The <strong class="text-primary">billing</strong>, <strong class="text-primary">sales</strong> and <strong class="text-primary">automation</strong> platform for service businesses.</h2>
                      <p>Upmind includes everything you need to successfully run and scale your online business.</p>
                      <upw-button @click="doUpdate(false)" label="Get Started for free" appendIcon="arron-right">
                      </upw-button>

                  </div>

              </div>
          </section>
        </upw-dialog>
    `,
  }),
  args: {
    title: undefined,
  },
};

export const Form: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwDialog, UpwButton, UpwForm },
    setup() {
      const model = ref({});

      return {
        args,
        model,
        schema,
      };
    },
    methods: {
      doUpdate(value: boolean) {
        updateArgs({ modelValue: value });
      },
    },
    template: `
        <upw-button variant="ghost" block @click="doUpdate(true)">Open Dialog</upw-button>
        <upw-dialog v-bind="args" @update:modelValue="doUpdate">
          <upw-form
            class="mt-8"
            :schema="schema"
            v-model="model"
            @resolve="doUpdate(false)"
            @reject="doUpdate(false)"
          />
        </upw-dialog>
    `,
  }),
  args: {
    title: "A simple form within a dialog",
  },
};
