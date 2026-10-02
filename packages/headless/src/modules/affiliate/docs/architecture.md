# Affiliate Architecture

## Overview

The module is a client-self data layer plus one guest request. A shared account source publishes the client's own account id. Every other client composable keys its requests on that id. Four criteria-driven collections serve the lists. Two form editors reuse the shared `dataManagerMachine` through a config payload; the module owns no machine of its own. A separate guest composable records referral-link visits and writes the attribution cookie.

The scope matrix is deliberately narrow: each cell is `null as never`, so `.as(...)` stays spellable for every actor and `.for(...)` has no context to retarget. Each client composable refuses a resolved actor other than the client at runtime. There is no per-actor services split, because only one actor holds the capability.

## Data Flow

```text
 session ──▶ useAffiliateActiveAccount ──▶ activeAccountId
                (GET self)                      │
        ┌───────────────┬───────────────┬───────┴───────┐
        ▼               ▼               ▼               ▼
 useClientAffiliate  collections   link manager   payout manager
  account + balance   links          GET link      GET account
  gate + area keys    referrals      POST/PUT      GET destinations
  enrol, withdraw     commissions    (+ DELETE     GET emails
                      payouts         from list)   PUT account

 (guest) link visit — its own branch, reads no session and no account id
  POST visit ──▶ cookie write ──▶ redirect target
```

1. **Resolve** → the source reads `/self`, picks its `account_id` when the client holds that account, else the client's only account. A generation counter drops results of superseded runs.
2. **Key** → each consumer derives its request key from the published id. A collection keeps its own key ref and clears it when the id clears, so rows of the previous account are never served.
3. **Read** → account and balance reads use TanStack `useQuery` directly, so two instances under one account share one request each and a 404 resolves as empty data. Settings reads are raw one-shot requests outside the query cache.
4. **Write** → services check membership of the pinned account (save services only), send the request, then invalidate the affected keys.
5. **Expose** → each composable returns `useActions`, `useContext`, `useMeta`, `useInternals`.

## File layout

| File | Role |
| --- | --- |
| `index.ts` | The only public surface |
| `affiliate.services.ts` | Every request. Internal marker on line 1 |
| `affiliate.schemas.ts` | Query schemas, sort and filter uischemas, link / payout / withdrawal form schemas. Internal |
| `affiliate.mappers.ts` | Payout row mapping. Internal |
| `affiliate.types.ts` | Matrices, models, query-model types, `CommissionStatus` |
| `affiliate.utils.ts` | Referral origin, commission status derivations, PayPal and destination helpers |
| `use*.machine.ts` | `dataManagerMachine` config for the two editors. Internal |
| `use*.ts` + `.actions` / `.context` / `.meta` / `.internals` | The nine composables |
| `__tests__/` | Integration suites over recorded captures, recordings, scenarios and negative-control patches |

## Sub-Composables

| Layer | Carries |
| --- | --- |
| `useActions()` | Methods: enrol, withdraw, refresh, paging, sort, save, visit, lifecycle |
| `useContext()` | Computed values: record, balances, rows, model, schemas, errors, referral origin |
| `useMeta()` | State flags: loading, enrolled, can-withdraw, dirty, valid, has-error |
| `useInternals()` | Raw state for debugging |

The client-affiliate composable exports only the `UseClientAffiliate` type from the barrel; it and the links, referrals, commissions and payouts composables export no `Use*Actions`, `Use*Context`, `Use*Meta` or `Use*Internals` aliases. The client portal's mock contract already exports those names, and the duplicate-type gate blocks a second declaration.

## Services

One services file for every actor. Endpoints:

| Endpoint | Used by |
| --- | --- |
| `GET self` | Account source |
| `GET self?with=actor.brand` | Brand fallback in the client composable and the link manager's brand name |
| `GET accounts/{a}/affiliate` | Account read, payout editor seed and re-read |
| `GET accounts/{a}/affiliate/balance` | Balance read |
| `POST accounts/{a}/affiliate` | Enrol |
| `POST accounts/{a}/affiliate/withdraw` | Withdrawal |
| `GET config/brand/values` | Gate keys and area keys |
| `GET/POST/PUT/DELETE accounts/{a}/affiliate/links[/{id}]` | Links list and editor |
| `GET accounts/{a}/affiliate/referrals` | Referrals |
| `GET accounts/{a}/affiliate/pending_commissions` | Commissions |
| `GET accounts/{a}/affiliate/payouts` | Payouts |
| `GET brands/{b}/affiliate_payout_destination` | Destination lookup |
| `GET clients/{c}/emails` | Email lookup (`limit=0`) |
| `PUT accounts/{a}` | Save payout destination |
| `POST affiliate_link/visit` | Guest visit (no access token) |

## Dependencies

### Affiliate Depends On

| Module | Usage |
| --- | --- |
| `query` | `request`, `post`, `put`, `del`, `list` with criteria, `useUrl`, key invalidation. Read-only: the module routes around the query core and never changes it |
| `session-store` | Active user's account list, client id, brand id, actor, session id, logout hook |
| `brand` | Brand id, name, oauth clients |
| `scope` | `createScopedComposable`, registry |
| `data-manager` | `dataManagerMachine` for the two editors |
| `system-localisation` | `useI18n` for error text |
| `utils` | Cookies, errors, validation and model parser, machine helpers |
| `@upmind-automation/types` | Record types, brand config keys, payout destination code |

### Modules That Depend On Affiliate

No other module imports it. The portal app's affiliate area and the public referral-link route are the consumers.

## Integration Points

| System | Integration |
| --- | --- |
| **Platform API** | Endpoints above. Brand configuration is read as flat dotted keys |
| **Cookie jar** | `upm_aff`, path `/`, top-level domain, raw value |
| **Support tickets** | A withdrawal raises a ticket; the module returns its id and does not read tickets |
| **Translations** | `error.affiliate_*` in the error catalogue, `text.affiliate_withdraw_balance` in the text catalogue, `form.affiliate_*` for form and criteria labels |
| **Portal mock contract** | The module's public names follow the mock contract it replaces; where a name collides, the module renames its own type |
