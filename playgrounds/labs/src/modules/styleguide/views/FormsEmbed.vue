<template>
  <div
    class="prose mx-auto flex max-w-none flex-wrap place-content-start items-start justify-start gap-4 p-8"
  >
    <upw-form
      v-model="model"
      :schema="schema"
      :uischema="uischema"
      @reject="doReject"
      @resolve="doResolve"
      :loading="isLoading"
    />

    <code class="w-1/2 flex-grow self-stretch rounded-lg bg-base-100 p-4">
      <pre class="sticky top-0">{{ model }}</pre>
    </code>
  </div>
</template>

<script setup>
import { UpwForm } from "@upmind-automation/upwind";
import { onMounted, ref } from "vue";
import { delay } from "lodash-es";
import { useDateFormat, useNow } from "@vueuse/core";

const isLoading = ref(true);
const model = ref({});

const today = useDateFormat(useNow(), "YYYY-MM-DD");
const now = useDateFormat(useNow(), "YYYY-MM-DD HH:mm:ss");

const schema = {
  required: ["name", "text", "rating", "accept", "oneOfEnum"],
  properties: {
    name: {
      type: ["string"],
      title: "Task",
      description: "The task's name",
    },
    text: {
      type: ["string", "null"],
      title: "Text Input",
    },
    text2: {
      type: ["string", "null"],
      title: "Disabled Text Input",
      readOnly: true,
    },
    text3: {
      type: ["string", "null"],
      title: "Text Input with Icon",
    },
    description: {
      title: "Short Description",
      type: ["string", "null"],
      maxLength: 100,
    },
    note: {
      title: "Long Description/Details",
      type: ["string", "null"],
      maxLength: 280,
    },

    url: {
      type: "string",
      format: "uri",
      title: "URL",
      description: "The task's trello URL",
    },

    email: {
      type: "string",
      format: "email",
      title: "Email",
      description: "The notification email address",
    },

    password: {
      type: "string",
      format: "password",
      title: "Password",
      description: "A password to access the task",
    },

    rating: {
      type: "integer",
      maximum: 5,
      minimum: 1,

      title: "Rate the difficulty",
      description: "The difficulty is measured between 1 (easy) and 5 (hard)",
    },

    impact: {
      type: "number",
      maximum: 10,
      minimum: 0,
      title: "Rate the impact",
      description: "The impact is measured between 0 (none) and 10 (high)",
    },

    dueDate: {
      type: ["string", "null"],
      format: "date",
      description: "The task's due date",
      formatMinimum: today.value,
    },
    dueDateTime: {
      type: ["string", "null"],
      format: "date-time",
      description: "The task's due date and time",
      formatMinimum: now.value,
    },

    recurrence: {
      title: "Recurrs...",
      type: ["string", "null"],
      enum: ["Daily", "Weekly", "Monthly"],
    },

    recurrenceInterval: {
      title: "Every...",
      type: "integer",
      minimum: 1,
      maximum: 365,
    },

    oneOfEnum: {
      title: "Whats the situation?",
      type: ["string", "null"],
      description: "Hows your day been?",
      oneOf: [
        {
          const: "fu",
          title: "Started Badly",
          description:
            "It was a bad day initially...but there wa slight at the end of the tunnel",
        },
        {
          const: "bar",
          title: "Ended Badly",
          description:
            "It started with hope...then ended in the pits of dispair",
        },
        {
          const: "fubar",
          title: "Was a total nightmare",
          description: "Enough said",
        },
      ],
    },

    multiEnum: {
      type: "array",
      uniqueItems: true,
      title: "Pick one or more",
      description: "...catch a tiger by the toe",
      items: {
        type: "string",
        oneOf: [
          {
            const: "eeny",
            title: "Eeny",
          },
          {
            const: "meeny",
            title: "Meeny ",
          },
          {
            const: "miny",
            title: "Miny",
          },
          {
            const: "moe",
            title: "Moe",
          },
        ],
      },
    },

    done: {
      type: ["boolean", "null"],
      title: "Is the Task Complete?",
      default: null,
      enum: [true, false, null],
    },
    accept: {
      type: "boolean",
      title: "Accept our Terms and Conditions",
      description: "We need your agreement to align with regulations",
      default: null,
      enum: [null, true],
    },
  },
  errorMessage: {
    properties: {
      accept: "We require you accept our Terms and Conditions",
    },
  },
};

const uischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Label",
      label: "Label Name",
      text: "Label Text",
      altText: "Label Alt",
    },

    // {
    //   type: "Control",
    //   scope: "#/properties/name",
    //   options: {
    //     placeholder: "What needs to be done?",
    //     focus: true,
    //     prefix: "$",
    //     suffix: ".00",
    //     prependIcon: "cog",
    //     prependAvatar: { name: "ZA", path: "flags" },
    //     appendIcon: "devices",
    //     appendAvatar: { name: "GB", path: "flags" },
    //   },
    // },

    // {
    //   type: "Control",
    //   scope: "#/properties/description",
    //   options: {
    //     multi: true,
    //   },
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/note",
    //   options: {
    //     multi: true,
    //     rows: 6,
    //   },
    // },

    // {
    //   type: "Control",
    //   scope: "#/properties/text",
    //   options: {},
    // },

    // {
    //   type: "Control",
    //   scope: "#/properties/url",
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/email",
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/password",
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/text2",
    //   options: { prependIcon: "cog" },
    // },

    // {
    //   type: "Control",
    //   scope: "#/properties/text3",
    //   options: { appendIcon: "devices" },
    // },

    // {
    //   type: "Control",
    //   scope: "#/properties/rating",
    //   options: {
    //     styles: {
    //       control: {
    //         rating: {
    //           item: "form-radio mask-star-2",
    //           item1: "border-green-400 text-green-400",
    //           item2: "border-lime-400 text-lime-400",
    //           item3: "border-yellow-400 text-yellow-400",
    //           item4: "border-orange-400 text-orange-400",
    //           item5: "border-red-400 text-red-400",
    //         },
    //       },
    //     },
    //   },
    // },

    // {
    //   type: "Control",
    //   scope: "#/properties/impact",
    //   options: {
    //     // persistDescription: true,
    //     styles: {
    //       control: {
    //         rating: {
    //           item: "form-radio mask-star-2",
    //           item1: "border-green-400 text-green-400",
    //           item2: "border-lime-400 text-lime-400",
    //           item3: "border-yellow-400 text-yellow-400",
    //           item4: "border-orange-400 text-orange-400",
    //           item5: "border-red-400 text-red-400",
    //         },
    //       },
    //     },
    //   },
    // },

    // {
    //   type: "Control",
    //   scope: "#/properties/dueDate",
    //   options: {},
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/dueDateTime",
    //   options: {},
    // },

    {
      type: "Control",
      scope: "#/properties/multiEnum",
      options: {},
    },

    {
      type: "Control",
      scope: "#/properties/oneOfEnum",
      options: {
        format: "radio",
      },
    },

    // {
    //   type: "Control",
    //   scope: "#/properties/recurrence",
    //   options: {
    //     format: "radio",
    //   },
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/recurrenceInterval",
    //   options: {
    //     min: 1,
    //     max: 365,
    //     trim: true,
    //     suffix: "days",
    //   },
    //   rule: {
    //     effect: "SHOW",
    //     condition: {
    //       scope: "#/properties/recurrence",
    //       schema: { type: "string", const: "Daily" },
    //     },
    //   },
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/recurrenceInterval",
    //   options: {
    //     min: 1,
    //     max: 52,
    //     suffix: "weeks",
    //     trim: true,
    //   },
    //   rule: {
    //     effect: "SHOW",
    //     condition: {
    //       scope: "#/properties/recurrence",
    //       schema: { type: "string", const: "Weekly" },
    //     },
    //   },
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/recurrenceInterval",
    //   options: {
    //     min: 1,
    //     max: 12,
    //     suffix: "months",
    //     trim: true,
    //   },
    //   rule: {
    //     effect: "SHOW",
    //     condition: {
    //       scope: "#/properties/recurrence",
    //       schema: { type: "string", const: "Monthly" },
    //     },
    //   },
    // },

    // {
    //   type: "Control",
    //   scope: "#/properties/done",
    //   options: {},
    // },
    // {
    //   type: "Control",
    //   scope: "#/properties/accept",
    //   options: {},
    // },
  ],
};

function doReject() {}

function doResolve(value) {}

onMounted(() => {
  delay(() => {
    isLoading.value = false;
  }, 1000);
});
</script>
