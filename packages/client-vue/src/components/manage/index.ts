import { defineAsyncComponent } from "vue";

export const UpmManage = defineAsyncComponent(() => import("./Manage.vue"));
