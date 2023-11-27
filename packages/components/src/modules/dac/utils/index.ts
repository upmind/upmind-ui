// --- globals
import { unref } from "vue";

// --- utils
import { useMoney } from "../../../utils";
import { map, orderBy, uniqBy } from "lodash-es";

// --- types
import type {
  IDomainProduct,
  IProductPrice,
  IDomainProductMapped
} from "../types";
// ----------------------------------------------------------------------------

export function parseResults(
  sld: string,
  domains = [] as IDomainProduct[],
  results = [] as IDomainProductMapped[]
): IDomainProductMapped[] {
  const { removeTrailingZeroes } = useMoney();

  // map the results to a new array
  const newResults = map(domains, domain => {
    const term = orderBy(domain.prices, "billing_cycle_months", "asc")?.[0];
    const billing_cycle_years = Math.round(term.billing_cycle_months / 12);
    const is_discounted = !!term.price_discounted_formatted;
    const price = term.price;
    const price_discounted = term.price_discounted ?? 0;
    const price_formatted = removeTrailingZeroes(term.price_formatted);
    const price_discounted_formatted = removeTrailingZeroes(
      term.price_discounted_formatted
    );

    return {
      billing_cycle_years,
      billing_summary: $tc(
        is_discounted ? "billing_summary_discounted" : "billing_summary",
        billing_cycle_years,
        {
          oldPrice: price_formatted,
          newPrice: price_discounted_formatted
        }
      ),
      domain: [sld, domain.tld].join(""),
      is_available: domain.domain_available,
      is_discounted,
      order_url: constructOrderUrl(sld, domain, term),
      percentage_saving: is_discounted
        ? Math.floor(((price - price_discounted) / price) * 100)
        : 0,
      pid: domain.id,
      price_discounted_formatted,
      price_formatted,
      sld,
      tld: domain.tld
    };
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
  term: IProductPrice
) {
  const url = new URL(orderConfigUrl);
  url.searchParams.set("pid", domain.id);
  url.searchParams.set("bcm", term.billing_cycle_months.toString());
  url.searchParams.set("currency", term.currency_code);
  url.searchParams.set("pfields[sld]", sld);
  if (domain.sub_product_id)
    url.searchParams.set("sub_pids", domain.sub_product_id);
  // --- Add `coupons` parameter for applied promotions
  const codes = map(term?.promotions, "code");
  if (codes.length) url.searchParams.set("coupons", codes.join());

  return url;
}
