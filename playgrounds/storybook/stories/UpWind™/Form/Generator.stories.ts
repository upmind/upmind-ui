// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UpwForm } from "@upmind/upwind";

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwForm> = {
  parameters: {
    controls: {
      exclude: [
        "ajv",
        "mode",
        "additionalErrors",
        // "schema",
        // "uischema",
        "modelValue",
      ],
    },
  },
  component: UpwForm,
  render: args => ({
    components: { UpwForm },
    setup() {
      const model = ref({});

      function doReject() {}

      function doResolve(value) {}
      return {
        args,
        model,
        doReject,
        doResolve,
      };
    },
    template: `
      <upw-form
        v-bind="args"
        v-model="model"
        @reject="doReject"
        @resolve="doResolve"
      />

      <h4>Model</h4>
      <pre class="sticky top-0 rounded-lg bg-base-100 p-4">{{ model }}</pre>
    `,
  }),
  argTypes: {},
  args: {
    loading: false,
    processing: false,
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 3,
          title: "What is your name?",
          description: "Please enter your full name",
        },
        dob: {
          type: "string",
          format: "date",
          title: "What is your date of birth?",
        },
        postalCode: {
          type: "string",
          maxLength: 5,
          title: "What is your postal/zip code?",
        },

        personalData: {
          type: "object",
          properties: {
            weight: {
              type: "number",
              minimum: 0,
              maximum: 250,
              title: "How much do you weigh?",
            },
            height: {
              type: "integer",
              minimum: 120,
              maximum: 220,
              title: "How tall are you?",
            },
            drivingSkill: {
              type: "number",
              title: "How good are you at driving?",
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
              ],
            },
            vegetarian: {
              type: "boolean",
              title: "Are you a vegetarian?",
            },
            nationality: {
              type: "string",
              enum: ["DE", "IT", "JP", "US", "RU", "Other"],
              title: "What is your nationality?",
            },
            occupation: {
              type: "string",
              title: "What is your occupation?",
            },
          },
          required: ["weight", "height"],
        },
      },
      required: ["name", "dob", "postalCode", "nationality"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof UpwForm>;

export const Base: Story = {};

export const Formatted: Story = {
  args: {
    uischema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/name",
        },
        {
          type: "HorizontalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/dob",
            },
            {
              type: "Control",
              scope: "#/properties/postalCode",
            },
          ],
        },

        {
          type: "Group",
          label: "Personal Information",
          elements: [
            {
              type: "HorizontalLayout",
              elements: [
                {
                  type: "Control",
                  scope: "#/properties/personalData/properties/height",
                  options: {
                    appendText: "cm",
                  },
                },
                {
                  type: "Control",
                  scope: "#/properties/personalData/properties/weight",
                  options: {
                    appendText: "kg",
                  },
                },
              ],
            },
            {
              type: "Control",
              scope: "#/properties/personalData/properties/nationality",
            },
            {
              type: "Control",
              scope: "#/properties/personalData/properties/occupation",
              suggestion: [
                "Accountant",
                "Engineer",
                "Freelancer",
                "Journalism",
                "Physician",
                "Student",
                "Teacher",
                "Other",
              ],
            },
            {
              type: "Control",
              scope: "#/properties/personalData/properties/drivingSkill",
              options: {
                format: "radio",
              },
            },
            {
              type: "Control",
              scope: "#/properties/personalData/properties/vegetarian",
            },
          ],
        },
      ],
    },
  },
};
