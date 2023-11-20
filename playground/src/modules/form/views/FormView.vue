<template>
  <section class="forms w-full">
    <header
      class="navbar bg-base-100 shadow-md sticky top-0 z-10 pl-4 rounded-xl"
    >
      <div class="flex-1">
        <h2 class="title m-0">Form Demo</h2>
      </div>

      <div class="actions flex-none join">
        <slot name="actions"> </slot>
      </div>
    </header>

    <p>This will render a JSON form that is generated from a JSON schema.</p>

    <json-form
      :schema="schema"
      :uischema="null"
      @reject="doReject"
      @resolve="doResolve"
      debug
    />

    <footer></footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDate } from "../";
import JsonForm from "../components/Form.vue";

const schema = {
  required: ["name", "rating", "dueDate"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
      title: "Task",
      description: "The task's name"
    },

    description: {
      title: "Short Description",
      type: "string",
      maxLength: 100
    },

    note: {
      title: "Long Description/Details",
      type: "string",
      maxLength: 280
    },

    rating: {
      type: "integer",
      maximum: 5,
      minimum: 1,
      title: "Rate the difficulty",
      description: "The difficulty is measured between 1 (easy) and 5 (hard)"
    },

    dueDate: {
      type: "string",
      format: "date",
      description: "The task's due date",
      formatMaximum: useDate(),
      default: useDate()
    },

    recurrence: {
      type: "string",
      enum: ["Daily", "Weekly", "Monthly"]
    },

    recurrenceInterval: {
      type: "integer",
      description: "Days until recurrence"
    },

    done: {
      type: "boolean"
    }
  }
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
            focus: true
          }
        },

        {
          type: "Control",
          scope: "#/properties/rating",
          options: {
            // showUnfocusedDescription: true,
            styles: {
              control: {
                rating: {
                  item: "mask-star-2",
                  item1: "bg-green-400",
                  item2: "bg-lime-400",
                  item3: "bg-yellow-400",
                  item4: "bg-orange-400",
                  item5: "bg-red-400"
                }
              }
            }
          }
        },

        {
          type: "Control",
          scope: "#/properties/dueDate"
        },

        {
          type: "Control",
          scope: "#/properties/recurrence"
        },
        {
          type: "Control",
          scope: "#/properties/recurrenceInterval",
          options: {
            styles: {
              control: {
                input: "input input-bordered w-auto"
              }
            }
          },
          rule: {
            effect: "SHOW",
            condition: {
              scope: "#/properties/recurrence",
              schema: { type: "string", not: { const: null } }
            }
          }
        },
        {
          type: "Control",
          scope: "#/properties/done",
          options: {
            styles: {
              control: {
                checkbox: "checkbox checkbox-primary"
              }
            }
          }
        }
      ]
    },
    {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/description",
          options: {
            multi: true,
            rows: 5
          }
        },
        {
          type: "Control",
          scope: "#/properties/note",
          options: {
            multi: true,
            rows: 10
          }
        }
      ]
    }
  ]
};

function doReject() {
  console.log("doReject");
}

function doResolve(value) {
  console.log("doResolve", value);
}

const model = ref({});
</script>
