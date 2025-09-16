// --- types
import type {
  ITemplateCategory,
  IClientTemplateSlot
} from "@upmind-automation/types";

export type ClientTemplateSlot = {
  id: IClientTemplateSlot["id"];
  code: IClientTemplateSlot["code"];
  title: IClientTemplateSlot["name"];
  category?: {
    id: ITemplateCategory["id"];
    code: ITemplateCategory["code"];
    title: ITemplateCategory["name"];
  };
  categoryId: IClientTemplateSlot["category_id"];
  description: IClientTemplateSlot["description"];
};
