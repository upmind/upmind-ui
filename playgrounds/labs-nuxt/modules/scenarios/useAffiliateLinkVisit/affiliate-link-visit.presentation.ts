// -----------------------------------------------------------------------------
/**
 * @module scenarios/useAffiliateLinkVisit/affiliate-link-visit.presentation
 * @description How the guest's affiliate-link visit DRAWS — one record whose
 * only datum is the redirect target of the last visit, with the one write the
 * module offers.
 *
 * The module publishes no visit schema (its `visit(overrides?)` takes a
 * partial of `AffiliateLinkVisitModel`), so the write's form declares its own:
 * the three fields the composable defaults from the browser, each optional, so
 * an empty submit sends exactly what a real visit would.
 */

import { RecordActionPlacementTypes } from "../runtime/scenario.types";
import type { RecordUischema } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

export const linkVisitRecord: RecordUischema = {
  type: "RecordLayout",
  record: "target",
  // The module holds no record before the first visit: an empty one is the
  // starting state, not a load to wait for.
  drawsEmpty: true,
  header: {
    titleI18n: "labs.affiliate_link_visit",
    badges: [
      { flag: "hasVisited", i18n: "labs.affiliate_visited" },
      {
        flag: "hasError",
        i18n: "labs.affiliate_visit_failed",
        color: "danger"
      }
    ]
  },
  sections: [
    {
      kind: "fields",
      key: "target",
      elements: [
        {
          type: "TableCellText",
          scope: "#/properties/target",
          i18n: "labs.affiliate_visit_target"
        }
      ]
    }
  ],
  actions: [
    {
      name: "visit",
      i18n: "labs.affiliate_visit",
      icon: "link-external-01",
      busy: "isLoading",
      form: {
        schema: {
          type: "object",
          properties: {
            visitUrl: { type: "string" },
            referrerUrl: { type: "string" },
            userAgent: { type: "string" }
          }
        },
        uischema: {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/visitUrl",
              i18n: "form.affiliate_visit_url"
            },
            {
              type: "Control",
              scope: "#/properties/referrerUrl",
              i18n: "form.affiliate_visit_referrer_url"
            },
            {
              type: "Control",
              scope: "#/properties/userAgent",
              i18n: "form.affiliate_visit_user_agent"
            }
          ]
        },
        submit: "visit",
        args: ["#"],
        i18n: "labs.affiliate_visit",
        submitI18n: "labs.affiliate_visit"
      }
    },
    {
      name: "reset",
      i18n: "action.reset",
      icon: "x-close",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "reset"
    }
  ]
};
