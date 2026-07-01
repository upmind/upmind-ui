import { PromotionDisplayTypes, type PromotionDetails } from "../product";
import { useTranslateField, useTranslateName } from "../../utils";
import { isEmpty, reduce, toNumber } from "lodash-es";
import type { PromotionsContext } from "./basket-promotions.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { IBasketPromotion } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const useSchema = (_context: PromotionsContext) => {
  const schema = {
    type: "object",
    title: "Promotions",
    required: ["promocode"],
    properties: {
      promocode: {
        title: "Promo code",
        type: ["string", "null"]
      }
    }
  };

  return schema as JsonSchema;
};

export const useUischema = (_context: PromotionsContext) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/promocode",
        i18n: "form.promocode",
        options: {
          autoFocus: true,
          autocomplete: "off",
          placeholder: "Enter your voucher...",
          noLabel: true
        }
      }
    ]
  };

  return schema as UISchemaElement;
};

export const parsePromotionDetails = (
  raw?: IBasketPromotion[]
): PromotionDetails[] => {
  //  Promotions can be display in one of 3 ways:
  //  - As a generic summary label with no values, eg "SAVE"
  //  - As a summary percentage, eg "Save 20%"
  //  - As individual names, eg ["20% off", "Black Friday"]
  // NB: we always supply the amounts so we can show meta data if needed, eg a tooltip

  // ---

  if (isEmpty(raw)) return [];

  // ---

  return reduce(
    raw,
    (acc: PromotionDetails[], basketPromotion: IBasketPromotion) => {
      if (basketPromotion?.promotion?.hidden) return acc;

      acc.push({
        id: basketPromotion.id,
        code: basketPromotion.promotion.code,
        name: basketPromotion.promotion.name,
        title: useTranslateName(basketPromotion.promotion),
        description: useTranslateField(
          basketPromotion.promotion,
          "description"
        ),
        excerpt: useTranslateField(
          basketPromotion.promotion,
          "short_description"
        ),
        meta: {
          display: PromotionDisplayTypes.NAME,
          mixed: false,
          discounted: true
        },
        price: {
          savingAmount: toNumber(basketPromotion.promotion.amount),
          savingPrice: basketPromotion.promotion.amount_formatted,
          savingPercent: "" //TODO: missing % value from response
        }
      } as PromotionDetails);

      return acc;
    },
    []
  );
};
