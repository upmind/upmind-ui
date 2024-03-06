// --- globals
import { unref } from "vue";

// --- utils
import { useMoney } from "../../../utils";
import { map, orderBy, uniqBy, first } from "lodash-es";

// --- types
import type {
  IDomainProduct,
  IProductPrice,
  IDomainProductMapped,
} from "../types.d";
// ----------------------------------------------------------------------------

export function parseDomain(domain: string) {
  domain = unref(domain);
  const value = domain
    ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-.]?/gi, "")
    ?.toLowerCase();

  return {
    domain: value,
    tld: value?.match(/(?:^[^.]+)(\..{2,})/i)?.[1] || "",
    sld: first(value?.split(".")) || "",
  };
}

export function parseResults(
  sld: string,
  domains = [] as IDomainProduct[],
  results = [] as IDomainProductMapped[],
  orderConfigUrl = "" as string
): IDomainProductMapped[] {
  const { removeTrailingZeroes } = useMoney();

  // map the results to a new array
  const newResults = map(domains, domain => {
    const result = {
      pid: domain.id,
      domain: [sld, domain.tld].join(""),
      sld,
      tld: domain.tld,
      is_available: domain.domain_available,
    } as IDomainProductMapped;

    if (domain?.prices?.length) {
      const term = first(orderBy(domain.prices, "billing_cycle_months", "asc"));

      result.billing_cycle_years = Math.round(term.billing_cycle_months / 12);
      result.is_discounted = !!term.price_discounted_formatted;
      result.order_url = constructOrderUrl(sld, domain, term, orderConfigUrl);
      result.price_formatted = removeTrailingZeroes(term.price_formatted);
      result.price_discounted_formatted = removeTrailingZeroes(
        term.price_discounted_formatted
      );

      result.percentage_saving = !result.is_discounted
        ? 0
        : Math.floor(
            ((term.price - (term.price_discounted || 0)) / term.price) * 100
          );

      //   result.billing_summary = $tc(
      //   //   result.is_discounted ? "billing_summary_discounted" : "billing_summary",
      //   //   result.billing_cycle_years,
      //   //   {
      //   //     oldPrice: result.price_formatted,
      //   //     newPrice: result.price_discounted_formatted
      //   //   }
      //   // ),
    }

    return result;
  });

  results = unref(results); // safety check for reactivity/refs/proxies

  // then add the new results to any existing results
  results.push(...newResults);

  // and ensure we don't have any duplicates
  results = uniqBy(results, "domain");

  return results;
}

function constructOrderUrl(
  sld: string,
  domain: IDomainProduct,
  term: IProductPrice,
  orderConfigUrl: string
) {
  if (orderConfigUrl) {
    const url = new URL(orderConfigUrl);
    url.searchParams.set("pid", domain.id);
    url.searchParams.set("bcm", term.billing_cycle_months.toString());
    url.searchParams.set("currency", term.currency_code);
    url.searchParams.set("pfields[sld]", sld);
    if (domain.sub_product_id)
      url.searchParams.set("sub_pids", domain.sub_product_id);
    // --- Add `promotions` parameter for applied promotions
    const codes = map(term?.promotions, "code");
    if (codes.length) url.searchParams.set("promotions", codes.join());

    return url;
  }
  return null;
}
