<template>
  <div
    class="prose mx-auto flex max-w-none flex-wrap place-content-start items-start justify-start gap-4 p-8"
  >
    <upw-form
      :schema="schema"
      :uischema="uischema"
      @reject="doReject"
      @resolve="doResolve"
    />
  </div>
</template>

<script setup>
import { UpwForm } from "@upmind/upwind";

const useDate = val => {
  const date = val ? new Date(Date.parse(val)) : new Date();
  const yyyy = date.getFullYear();
  let mm = date.getMonth() + 1; // Months start at 0!
  let dd = date.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  const parsed = `${yyyy}-${mm}-${dd}`;
  return parsed;
};

const schema = {
  required: ["name", "rating"],
  properties: {
    name: {
      type: ["string", "null"],
      minLength: 1,
      title: "Task",
      description: "The task's name",
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

    domain: {
      type: ["string", "array", "null"],
      format: "domain_name",
      title: "Add A domain....",
      description: "",
    },

    dueDate: {
      type: ["string", "null"],
      format: "date",
      description: "The task's due date",
      formatMinimum: useDate(),
      default: useDate(),
    },

    recurrence: {
      type: ["string", "null"],
      enum: ["Daily", "Weekly", "Monthly"],
    },

    recurrenceInterval: {
      type: "integer",
      minimum: 1,
      maximum: 365,
    },

    done: {
      type: "boolean",
    },
  },
};

const uischema = {
  type: "HorizontalLayout",
  elements: [
    {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/name",
          options: {
            placeholder: "What needs to be done?",
            focus: true,
          },
        },

        {
          type: "Control",
          scope: "#/properties/rating",
          options: {
            // showUnfocusedDescription: true,
            styles: {
              control: {
                rating: {
                  item: "form-radio mask-star-2",
                  item1: "border-green-400 text-green-400",
                  item2: "border-lime-400 text-lime-400",
                  item3: "border-yellow-400 text-yellow-400",
                  item4: "border-orange-400 text-orange-400",
                  item5: "border-red-400 text-red-400",
                },
              },
            },
          },
        },

        {
          type: "Control",
          scope: "#/properties/impact",
          options: {
            // showUnfocusedDescription: true,
            styles: {
              control: {
                rating: {
                  item: "form-radio mask-star-2",
                  item1: "border-green-400 text-green-400",
                  item2: "border-lime-400 text-lime-400",
                  item3: "border-yellow-400 text-yellow-400",
                  item4: "border-orange-400 text-orange-400",
                  item5: "border-red-400 text-red-400",
                },
              },
            },
          },
        },

        {
          type: "Control",
          scope: "#/properties/dueDate",
          options: {
            saveFormat: "yyyy-MM-dd",
          },
        },

        {
          type: "Control",
          scope: "#/properties/recurrence",
        },
        {
          type: "Control",
          scope: "#/properties/recurrenceInterval",
          options: {
            min: 1,
            max: 365,
            placeholder: "Days until recurrence",
          },
          rule: {
            effect: "SHOW",
            condition: {
              scope: "#/properties/recurrence",
              schema: { type: "string", const: "Daily" },
            },
          },
        },
        {
          type: "Control",
          scope: "#/properties/recurrenceInterval",
          options: {
            placeholder: "Weeks until recurrence",
            min: 1,
            max: 52,
          },
          rule: {
            effect: "SHOW",
            condition: {
              scope: "#/properties/recurrence",
              schema: { type: "string", const: "Weekly" },
            },
          },
        },
        {
          type: "Control",
          scope: "#/properties/recurrenceInterval",
          options: {
            placeholder: "Months until recurrence",
            min: 1,
            max: 12,
          },
          rule: {
            effect: "SHOW",
            condition: {
              scope: "#/properties/recurrence",
              schema: { type: "string", const: "Monthly" },
            },
          },
        },
        {
          type: "Control",
          scope: "#/properties/done",
          options: {},
        },
      ],
    },
    {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/description",
          options: {
            multi: true,
            rows: 5,
          },
        },
        {
          type: "Control",
          scope: "#/properties/note",
          options: {
            multi: true,
            rows: 10,
          },
        },
      ],
    },
  ],
};

function doReject() {
  console.log("doReject");
}

function doResolve(value) {
  console.log("doResolve", value);
}
</script>
