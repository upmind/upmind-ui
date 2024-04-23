// --- global
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UpwForm } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwForm> = {
  parameters: {
    controls: {
      exclude: [
        "ajv",
        "mode",
        "additionalErrors",
        "schema",
        "uischema",
        "modelValue",
      ],
    },
  },
  component: UpwForm,
  render: args => ({
    components: { UpwForm },
    setup() {
      const model = ref({});

      function doReject() {
        alert("doReject");
      }

      function doResolve(value) {
        alert("doResolve", value);
      }
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
  },
};

export default meta;
type Story = StoryObj<typeof UpwForm>;

export const Base: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 3,
          description: "Please enter your full name",
        },
        vegetarian: {
          type: "boolean",
        },
        dob: {
          type: "string",
          format: "date",
          title: "Date of birth",
        },
        nationality: {
          type: "string",
          enum: ["DE", "IT", "JP", "US", "RU", "Other"],
        },
        personalData: {
          type: "object",
          properties: {
            weight: {
              type: "number",
              minimum: 0,
              maximum: 250,
            },
            height: {
              type: "integer",
              minimum: 120,
              maximum: 220,
            },
            drivingSkill: {
              type: "number",
              maximum: 10,
              minimum: 1,
              default: 7,
            },
          },
          required: ["weight", "height"],
        },
        occupation: {
          type: "string",
        },
        postalCode: {
          type: "string",
          maxLength: 5,
        },
      },
      required: ["name", "dob", "nationality"],
    },
    uischema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/name",
        },
        {
          type: "Control",
          scope: "#/properties/dob",
        },

        {
          type: "Group",
          label: "Additional Information",
          elements: [
            {
              type: "HorizontalLayout",
              elements: [
                {
                  type: "Control",
                  scope: "#/properties/personalData/properties/height",
                  options: {
                    suffix: "cm",
                  },
                },
                {
                  type: "Control",
                  scope: "#/properties/personalData/properties/weight",
                  options: {
                    suffix: "kg",
                  },
                },
              ],
            },
            {
              type: "Control",
              scope: "#/properties/nationality",
            },
            {
              type: "Control",
              scope: "#/properties/occupation",
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
          ],
        },
      ],
    },
  },
};
