// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockContacts
 * @description The client's four contact lists — emails, phones, addresses and
 * companies — as legacy's profile page manages them. `client` publishes the
 * address, company and phone rows (`AddressItem`, `CompanyItem`, `PhoneItem`)
 * but no list around them, and emails have no row component at all.
 * So every list is mocked here, pending the export decision
 * (`docs/client-vue-placeholder-audit.md` 2.1). The email facade is DECLARED with the real module's own
 * `Use<X>{Context,Meta,Actions}` types, so a member the real module renames
 * fails to compile here rather than drifting; the other three carry the same
 * receipt-shaped `writes`.
 *
 * `useActions()` therefore carries the real members with their real
 * signatures — which answer with the wire's own reply, never a receipt. The
 * dispatcher needs an outcome to word a toast (plan R4), so the same writes
 * appear once more under `writes`, receipt-shaped: a MOCK SEAM beside the
 * real surface, exactly as the collection generic's `search` / `applySort`
 * sit beside `filters` / `sort`. It dies at go-real.
 *
 * ADDING and EDITING arrive here as `writes.update` — one method, named for
 * the real managers' own (`useClientEmailManager` and its three siblings all
 * call it `update`, and all carry the row's id in their SCOPE rather than in
 * the call). `ensure` stays declared-and-refusing: it is the real Actions
 * type's member, and nothing this app renders calls it.
 */

import { computed, unref } from "vue";
import { clientEmailsCollection } from "../collection-defs";
import { countryName } from "../forms/engine-data";
import {
  MOCK_ADDRESS_TYPE,
  MOCK_EMAIL_TYPE,
  MOCK_PHONE_TYPE,
  MOCK_VERIFIED_LEVEL
} from "../types";
import { MOCK_RECEIPT_REASON, mockId } from "./facade";
import {
  assign,
  filter,
  find,
  get,
  isNumber,
  isString,
  map,
  remove,
  size,
  some,
  toLower,
  trim
} from "lodash-es";
import type { MockActionReceipt, MockFacadeInternals } from "./facade";
import type {
  MockAddress,
  MockCompany,
  MockDataset,
  MockEmail,
  MockPhone
} from "../types";
import type { FormModel } from "@upmind/ui";
import type { Email } from "@upmind-automation/headless";
import type { MaybeRef } from "vue";

/** How long the code the verification mail carries is — the account module's own six. */
const VERIFICATION_CODE_LENGTH = 6;

const DIGITS_ONLY = /^\d+$/;

/**
 * Every contact row carries the same two facts the panels gate on. `id` is
 * optional because the real `Email` inherits its own from `EmailModel`, where
 * a row being edited may not have one yet.
 */
type MockContactRow = {
  readonly id?: string;
  readonly meta: { readonly isDefault: boolean; readonly canDelete: boolean };
};

/**
 * MOCK-SEAM ONLY: the writes, answering with a receipt the dispatcher renders.
 * The real members do the same work and answer as the wire does. Dies at
 * go-real.
 */
export type MockContactWrites<TRow> = {
  /**
   * Creates a row (no id) or edits one (an id), from a submitted form model.
   *
   * CHANGE (plan §3): the real managers name this `update` and carry the row's
   * id in their SCOPE — `manager.fresh().update(model)` creates,
   * `manager.for(EMAIL, id).update(model)` edits. A COLLECTION facade holds no
   * per-row scope to carry it, so the id arrives as the first argument. The
   * name is the real one; only where the id rides differs.
   */
  update: (
    id: string | undefined,
    model: FormModel
  ) => MockActionReceipt<TRow> | undefined;
  /** Promotes one row to the account's default; the one already default refuses. */
  setDefault: (id: string) => MockActionReceipt<TRow> | undefined;
  /** Deletes one row; the default, and anything the platform keeps, refuses. */
  remove: (id: string) => MockActionReceipt<TRow> | undefined;
  /**
   * Why this row cannot be deleted, or undefined when it can — asked BEFORE
   * the confirmation is offered, so a row the account falls back on is
   * refused outright rather than behind a dialog whose accept then refuses
   * (plan R4), exactly as a card that cannot be removed is.
   */
  whyNotRemovable: (id: string) => MockActionReceipt<TRow> | undefined;
};

/**
 * MOCK-SEAM ONLY: the email list's writes. `verify` is the receipt-shaped
 * twin of the real `verify()` — legacy's "resend verification" control.
 */
export type MockEmailWrites = MockContactWrites<MockEmail> & {
  verify: (id: string) => MockActionReceipt<MockEmail> | undefined;
  /**
   * The code the verification mail carried, entered by hand — legacy's
   * `enter_verification_code`, offered on the address the account signs in
   * with while it is still unconfirmed. A mock has no mail to agree with, so
   * it judges the SHAPE and nothing else, exactly as the two-factor step does.
   */
  verifyWithCode: (
    id: string,
    code: string
  ) => MockActionReceipt<MockEmail> | undefined;
  /**
   * Which topics ONE address receives, saved whole — legacy's per-address
   * opt-in screen, reached signed OUT with the address in the link
   * (`manageEmailTopicOptIns.vue`). The address is named, not addressed by id:
   * a token link carries what was written to, never a row key.
   */
  saveTopicOptIns: (
    address: string,
    model: FormModel
  ) => MockActionReceipt<MockEmail>;
};

/**
 * Whether an address receives anything at all. The wire DERIVES this
 * (`clients_emails.receive_emails` is true once the address holds at least one
 * opt-in) and never accepts a write for it, so the row carries the opt-ins and
 * this reads them — a stored copy would be a second answer to drift from.
 */
export function isReceivingEmails(entry: MockEmail): boolean {
  return entry.topicOptIns.length > 0;
}

/** One instance per dataset, as the scope registry mints one per scope. */
function perDataset<T>(
  build: (data: MockDataset) => T
): (data: MockDataset) => T {
  const instances = new WeakMap<MockDataset, T>();
  return (data: MockDataset): T => {
    const existing = instances.get(data);
    if (existing !== undefined) return existing;
    const minted = build(data);
    instances.set(data, minted);
    return minted;
  };
}

/** The real `getDefault` takes an override list; absent, it reads the module's own. */
function resolveRows<TRow>(
  override: MaybeRef<TRow[] | null | undefined> | undefined,
  fallback: readonly TRow[]
): readonly TRow[] {
  const given = unref(override);
  if (given === null || given === undefined) return fallback;
  return given;
}

/** The account's fallback row — read off the whole list, never a narrowed page. */
function defaultRow<TRow extends MockContactRow>(
  rows: readonly TRow[]
): TRow | undefined {
  return find(rows, row => row.meta.isDefault);
}

/** Why this row cannot be deleted, or undefined when it can. */
function deletionRefusal<TRow extends MockContactRow>(
  row: TRow
): MockActionReceipt<TRow> | undefined {
  if (row.meta.isDefault) {
    return {
      ok: false,
      reason: MOCK_RECEIPT_REASON.DEFAULT_CONTACT,
      entity: row
    };
  }
  if (!row.meta.canDelete) {
    return {
      ok: false,
      reason: MOCK_RECEIPT_REASON.NOT_DELETABLE,
      entity: row
    };
  }
  return undefined;
}

/**
 * The two writes every contact list shares. `alsoDefault` is the company
 * row's second copy of the same fact (`ICompany.default`), which the wire
 * carries beside `meta.isDefault` — a row that disagrees with itself would
 * read one way in the list and another in the picker.
 */
function contactWrites<TRow extends MockContactRow>(
  rows: TRow[],
  alsoDefault?: (row: TRow, isDefault: boolean) => void
): Omit<MockContactWrites<TRow>, "update"> {
  function applyDefault(row: TRow, isDefault: boolean): void {
    assign(row.meta, { isDefault });
    alsoDefault?.(row, isDefault);
  }

  return {
    setDefault: (id: string): MockActionReceipt<TRow> | undefined => {
      const row = find(rows, candidate => candidate.id === id);
      if (row === undefined) return undefined;
      if (row.meta.isDefault) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.ALREADY_DEFAULT,
          entity: row
        };
      }
      // Exactly one row is the account's fallback, so the outgoing default
      // steps down in the same write the incoming one steps up.
      for (const other of filter(rows, candidate => candidate.id !== id)) {
        applyDefault(other, false);
      }
      applyDefault(row, true);
      return { ok: true, entity: row };
    },

    remove: (id: string): MockActionReceipt<TRow> | undefined => {
      const row = find(rows, candidate => candidate.id === id);
      if (row === undefined) return undefined;
      const refused = deletionRefusal(row);
      if (refused !== undefined) return refused;
      remove(rows, candidate => candidate.id === id);
      return { ok: true, entity: row };
    },

    whyNotRemovable: (id: string): MockActionReceipt<TRow> | undefined => {
      const row = find(rows, candidate => candidate.id === id);
      if (row === undefined) return undefined;
      return deletionRefusal(row);
    }
  };
}

/** What a declared-but-unbuilt member answers — nothing this app renders calls it. */
function notBuilt<T>(): Promise<T> {
  return Promise.reject(
    new Error("That contact call is not available in this preview.")
  );
}

/** One string field off a submitted model — an absent or non-string value reads as empty. */
function modelString(model: FormModel, path: string): string {
  const value = get(model, path);
  if (!isString(value)) return "";
  return trim(value);
}

/** A refusal every duplicate answers with, whichever list raised it. */
function duplicate<TRow>(row?: TRow): MockActionReceipt<TRow> {
  return {
    ok: false,
    reason: MOCK_RECEIPT_REASON.DUPLICATE_CONTACT,
    entity: row
  };
}

const NO_INTERNALS: MockFacadeInternals = { query: undefined };

// --- emails ------------------------------------------------------------------

export const useMockClientEmails = perDataset((data: MockDataset) => {
  const collection = clientEmailsCollection.resolve(data);
  const { findOne, getOne, pagination, data: rows } = collection.useContext();
  const writes: MockEmailWrites = assign({}, contactWrites(data.emails), {
    update: (
      id: string | undefined,
      model: FormModel
    ): MockActionReceipt<MockEmail> | undefined => {
      const address = modelString(model, "email");
      const held = some(
        data.emails,
        candidate =>
          candidate.id !== id &&
          toLower(candidate.email ?? "") === toLower(address)
      );
      if (held) return duplicate<MockEmail>();

      if (id === undefined) {
        // A fresh address is nobody's default and nothing has confirmed it yet
        // — legacy sends the verification mail and leaves the row unverified.
        const created: MockEmail = {
          id: mockId("eml", map(data.emails, "id")),
          email: address,
          title: address,
          description: "Account",
          type: MOCK_EMAIL_TYPE.ACCOUNT,
          // Subscribed to everything the brand publishes: legacy's own new
          // address receives, and the opt-in screen is where that is narrowed.
          topicOptIns: map(data.emailTopics, "id"),
          meta: {
            isDefault: false,
            canDelete: true,
            isVerified: false,
            isBounced: false
          }
        };
        data.emails.push(created);
        return { ok: true, entity: created };
      }

      const row = find(data.emails, candidate => candidate.id === id);
      if (row === undefined) return undefined;
      assign(row, { email: address, title: address });
      return { ok: true, entity: row };
    },
    verify: (id: string): MockActionReceipt<MockEmail> | undefined => {
      const entry = find(data.emails, candidate => candidate.id === id);
      if (entry === undefined) return undefined;
      // The mock has no inbox to click a link in, so the send IS the
      // confirmation — legacy's own resend leaves the address verified.
      assign(entry.meta, { isVerified: true });
      return { ok: true, entity: entry };
    },
    verifyWithCode: (
      id: string,
      code: string
    ): MockActionReceipt<MockEmail> | undefined => {
      const entry = find(data.emails, candidate => candidate.id === id);
      if (entry === undefined) return undefined;
      const isRightLength = size(code) === VERIFICATION_CODE_LENGTH;
      const isAllDigits = DIGITS_ONLY.test(code);
      if (!isRightLength || !isAllDigits) {
        return {
          ok: false,
          reason: MOCK_RECEIPT_REASON.INVALID_VERIFICATION_CODE,
          entity: entry
        };
      }
      assign(entry.meta, { isVerified: true });
      return { ok: true, entity: entry };
    },
    saveTopicOptIns: (
      address: string,
      model: FormModel
    ): MockActionReceipt<MockEmail> => {
      const entry = find(
        data.emails,
        candidate => toLower(candidate.email ?? "") === toLower(address)
      );
      // A link naming an address this account does not hold is a link that
      // reached the wrong door — the refusal says so, rather than the
      // standing not-found the dispatcher words for a missing ROW id.
      if (entry === undefined) {
        return { ok: false, reason: MOCK_RECEIPT_REASON.UNKNOWN_EMAIL };
      }
      assign(entry, {
        topicOptIns: filter(
          map(data.emailTopics, "id"),
          topicId => model[topicId] === true
        )
      });
      return { ok: true, entity: entry };
    }
  });

  const context = {
    data: rows,
    // The real member takes the module's OWN row, not the mock's: a caller
    // handing over a list hands over `Email[]`, and the seed's extra fact
    // (`topicOptIns`) is not one it has to supply.
    default: (override?: MaybeRef<Email[] | null | undefined>) =>
      defaultRow(resolveRows(override, data.emails)),
    error: computed(() => undefined),
    findOne,
    getOne,
    pagination
  };

  const actions = assign({}, collection.useActions(), {
    ensure: () => notBuilt<MockEmail>(),
    remove: async (id: string): Promise<void> => {
      writes.remove(id);
    },
    setDefault: async (id: string) => {
      writes.setDefault(id);
      return undefined;
    },
    /** Resends the verification email — legacy's own wording is "resend". */
    verify: async (id: string): Promise<void> => {
      writes.verify(id);
    },
    writes
  });

  return {
    useActions: () => actions,
    useContext: () => context,
    useInternals: () => NO_INTERNALS,
    useMeta: () => collection.useMeta()
  };
});

// --- phones ------------------------------------------------------------------

/** The account's country for a new contact — where its default address is, else the seed's. */
export function accountCountryId(data: MockDataset): string {
  const home = find(data.addresses, row => row.meta.isDefault);
  if (home !== undefined) return home.address.countryId;
  return "GB";
}

/** Digits and the leading plus — what two spellings of one number share. */
function phoneKey(number: string | null): string {
  if (number === null) return "";
  return number.replace(/[^\d+]/g, "");
}

/**
 * The dial code and country a new number is filed under. The mock carries no
 * number parser, so it files a new number where the account's default number
 * is — legacy's own modal defaults its dial code the same way.
 */
function phoneOrigin(
  data: MockDataset
): Pick<MockPhone["phone"], "countryCallingCode" | "country"> {
  const home = find(data.phones, row => row.meta.isDefault);
  if (home !== undefined) {
    return {
      countryCallingCode: home.phone.countryCallingCode,
      country: home.phone.country
    };
  }
  return { countryCallingCode: "44", country: accountCountryId(data) };
}

/** The wire insists a company has a phone; a new one takes the account's own. */
function accountPhoneId(data: MockDataset): string {
  const home = defaultRow(data.phones) ?? data.phones[0];
  return home?.id ?? "";
}

export const useMockClientPhones = perDataset((data: MockDataset) => {
  const writes: MockContactWrites<MockPhone> = assign(
    {},
    contactWrites(data.phones),
    {
      update: (
        id: string | undefined,
        model: FormModel
      ): MockActionReceipt<MockPhone> | undefined => {
        const typed = modelString(model, "phone");
        const held = some(
          data.phones,
          candidate =>
            candidate.id !== id &&
            phoneKey(candidate.phone.number) === phoneKey(typed)
        );
        if (held) return duplicate<MockPhone>();
        const origin = phoneOrigin(data);
        const phone = {
          number: phoneKey(typed),
          nationalNumber: typed,
          countryCallingCode: origin.countryCallingCode,
          country: origin.country
        };
        if (id === undefined) {
          const created: MockPhone = {
            id: mockId("tel", map(data.phones, "id")),
            title: typed,
            description: "Mobile",
            phone,
            type: MOCK_PHONE_TYPE.MOBILE,
            meta: { canDelete: true, isVerified: false, isDefault: false }
          };
          data.phones.push(created);
          return { ok: true, entity: created };
        }
        const row = find(data.phones, candidate => candidate.id === id);
        if (row === undefined) return undefined;
        assign(row, { title: typed, phone });
        return { ok: true, entity: row };
      }
    }
  );
  return { useActions: () => ({ writes }) };
});

// --- addresses ---------------------------------------------------------------

type AddressBlock = MockAddress["address"];

/** The wire keeps an optional line as null, never as "". */
function nullIfBlank(text: string): string | null {
  if (text === "") return null;
  return text;
}

/** The address fields a form submitted, in the wire's spelling. */
function submittedAddress(model: FormModel): AddressBlock {
  const block = get(model, "address");
  const text = (key: string) => modelString(block, key);
  const region = text("regionId");
  const line2 = text("address2");
  return {
    address1: text("address1"),
    address2: nullIfBlank(line2),
    city: text("city"),
    postcode: text("postcode"),
    countryId: text("countryId"),
    regionId: nullIfBlank(region)
  };
}

/** One line for a card — legacy's own `description`: street, then town and postcode. */
function addressLine(block: AddressBlock): string {
  return `${block.address1}, ${block.city} ${block.postcode}`;
}

function submittedAddressType(model: FormModel): MockAddress["type"] {
  const type = get(model, "type");
  if (isNumber(type)) return type;
  return MOCK_ADDRESS_TYPE.HOME;
}

/** Writes one address row from a form, minting it where no id is given. */
function writeAddress(
  data: MockDataset,
  id: string | undefined,
  name: string,
  type: MockAddress["type"],
  block: AddressBlock
): MockAddress | undefined {
  const facts = {
    name,
    title: name,
    description: addressLine(block),
    countryName: countryName(block.countryId),
    type,
    address: block
  };
  if (id === undefined) {
    const created: MockAddress = assign(
      {
        id: mockId("addr", map(data.addresses, "id")),
        clientId: data.persona.id,
        verifiedLevel: MOCK_VERIFIED_LEVEL.NONE,
        meta: { canDelete: true, isDefault: false, isVerified: false }
      },
      facts
    );
    data.addresses.push(created);
    return created;
  }
  const row = find(data.addresses, candidate => candidate.id === id);
  if (row === undefined) return undefined;
  assign(row, facts);
  return row;
}

export const useMockClientAddresses = perDataset((data: MockDataset) => {
  const writes: MockContactWrites<MockAddress> = assign(
    {},
    contactWrites(data.addresses),
    {
      update: (
        id: string | undefined,
        model: FormModel
      ): MockActionReceipt<MockAddress> | undefined => {
        const row = writeAddress(
          data,
          id,
          modelString(model, "name"),
          submittedAddressType(model),
          submittedAddress(model)
        );
        if (row === undefined) return undefined;
        return { ok: true, entity: row };
      }
    }
  );
  return { useActions: () => ({ writes }) };
});

// --- companies ---------------------------------------------------------------

/** The address book row a company invoices from, where it still exists. */
export function companyAddress(
  data: MockDataset,
  company: MockCompany
): MockAddress | undefined {
  return find(data.addresses, candidate => candidate.id === company.addressId);
}

export const useMockClientCompanies = perDataset((data: MockDataset) => {
  const writes: MockContactWrites<MockCompany> = assign(
    {},
    // The wire carries the default twice (`default`, `meta.isDefault`); one
    // write moves both.
    contactWrites(data.companies, (row, isDefault) => {
      assign(row, { default: isDefault });
    }),
    {
      update: (
        id: string | undefined,
        model: FormModel
      ): MockActionReceipt<MockCompany> | undefined => {
        const name = modelString(model, "name");
        const held = some(
          data.companies,
          candidate =>
            candidate.id !== id && toLower(candidate.name) === toLower(name)
        );
        if (held) return duplicate<MockCompany>();
        const regNumber = modelString(model, "regNumber");
        const taxNumber = modelString(model, "tax.number");
        const block = submittedAddress(model);
        const existing = find(data.companies, candidate => candidate.id === id);
        // A company's address is its own row in the address book, filed under
        // the company's name — legacy's `address_id`.
        const address = writeAddress(
          data,
          existing?.addressId,
          name,
          MOCK_ADDRESS_TYPE.COMPANY,
          block
        );
        if (address === undefined) return undefined;
        const facts = {
          name,
          title: name,
          description: addressLine(block),
          regNumber: nullIfBlank(regNumber),
          addressId: address.id
        };
        if (existing === undefined) {
          // Unchecked until the platform validates it — legacy's fresh company.
          const tax: MockCompany["tax"] = {
            valid: 0,
            percent: null,
            number: nullIfBlank(taxNumber),
            reason: null,
            checked: { date: null, relative: "" },
            with: null
          };
          const created: MockCompany = assign(
            {
              id: mockId("co", map(data.companies, "id")),
              emailId: defaultRow(data.emails)?.id ?? null,
              phoneId: accountPhoneId(data),
              default: false,
              tax,
              meta: {
                isDefault: false,
                canDelete: true,
                isVerified: false,
                hasTax: taxNumber !== "",
                hasTaxValidation: false,
                hasValidTax: false
              }
            },
            facts
          );
          data.companies.push(created);
          return { ok: true, entity: created };
        }
        assign(existing, facts);
        assign(existing.tax, { number: nullIfBlank(taxNumber) });
        assign(existing.meta, { hasTax: taxNumber !== "" });
        return { ok: true, entity: existing };
      }
    }
  );
  return { useActions: () => ({ writes }) };
});
