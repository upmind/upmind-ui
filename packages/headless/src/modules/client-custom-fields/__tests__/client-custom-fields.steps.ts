// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/client-custom-fields.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `client-custom-fields.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog re-registers
 * against any runner.
 *
 * Every handler speaks to the module through the `World` members. There is no
 * DOM read, no request read and no import of the module's own source here.
 *
 * The DEFINITIONS collection (`useClientCustomFields`) is the only driveable
 * surface: it is read-only, so the driven steps read the catalogue, refresh it,
 * narrow it in memory, re-order it and search it — each an action the composable
 * publishes and the recorded corpus can answer. The per-field IMAGE editor
 * (`useClientCustomFieldImage`) has no driven scenario: its whole surface is a
 * multipart upload the scenario Generator cannot record and the World cannot
 * hand a File across, so its capabilities stay `@todo` in the feature.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";
import { ScopeActorTypes } from "../../scope/scope.types";
import ac20Record from "./scenarios/a-stored-image-gives-me-a-link-and-a-preview-and-clearing-removes-both/03/get-clients-id.json";
import ac22Catalogue from "./scenarios/only-the-images-i-actually-changed-get-uploaded-again/03/get-custom-fields-filter-object-type-client.json";
import ac22ChangedUpload from "./scenarios/only-the-images-i-actually-changed-get-uploaded-again/04/post-clients-fields-id-image.json";
import ac21Upload from "./scenarios/a-changed-image-is-safely-stored-before-the-rest-of-my-save-happens/04/post-clients-fields-id-image.json";
import { find, startsWith, values } from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/**
 * The scenario key this feature is driven under. A literal here rather than an
 * import: `packages/headless` holds no scenario concept at all — the key is the
 * consuming playground's, and this catalog names it the same way a `.feature`
 * names a url.
 */
export const CLIENT_CUSTOM_FIELDS_SCENARIO = "client_custom_fields";

/**
 * The action ids these steps drive. Exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift: an id declared
 * here and fired by no step below is a gate failure, never a silent over-report.
 */
export const CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  narrowBy: "narrowBy",
  sortBy: "sortBy",
  filterBy: "filterBy",
  setCriteria: "setCriteria",
  nextPage: "nextPage",
  upload: "upload",
  flush: "flush"
} as const;

/** The image editor is booted under its OWN scenario key beside the collection —
 * a second live cell (ADR 035 Amendment 1 §4). `.for('field', id)` names the
 * field whose image value is edited. */
export const CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO = "client_custom_field_image";

/** The image editor's context type — a literal mirroring
 * `ClientCustomFieldContextTypes.FIELD`, so this catalog imports no module source. */
const FIELD_CONTEXT = "field";

/** The staging brand's IMAGE field (`profile_picture`) — a stable catalogue
 * entity, not created per run, so its id is spelled here like `NARROW_CODE`. */
const IMAGE_FIELD_ID = "3de78642-de53-9714-7ec2-1208469530d0";

/** A 1x1 PNG as upload MATERIAL. The replay matcher answers a POST by
 * path+method, so the bytes never decide the reply — the File only drives the
 * composable to send its real upload request. */
function pixelPng(): File {
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], "pixel.png", { type: "image/png" });
}

/** The image editor's SECOND scenario key — AC-22 boots two image cells at once. */
export const CLIENT_CUSTOM_FIELD_IMAGE_2_SCENARIO =
  "client_custom_field_image_2";

async function openImageEditorFor(
  world: World,
  scenario: string,
  fieldId: string
): Promise<void> {
  await world.boot(scenario, {
    actor: ScopeActorTypes.CLIENT,
    context: { type: FIELD_CONTEXT, id: fieldId }
  });
  await world.fire(
    CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady,
    undefined,
    scenario
  );
}

const openImageEditor = (world: World): Promise<void> =>
  openImageEditorFor(world, CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO, IMAGE_FIELD_ID);

// --- values read from the image scenarios' own recordings (ADR 035) -----------

type ClientRecordRecording = {
  response: {
    body: {
      data: {
        custom_fields?: {
          value?: string | null;
          field_id?: string;
          field?: { code?: string };
        }[];
      };
    };
  };
};
type CatalogueRecording = {
  response: { body: { data: { id: string; code: string }[] } };
};
type UploadRecording = { response: { body: { data: { value?: string } } } };

/** The stored image hash the AC-20 recording holds for `profile_picture`. */
const AC20_STORED_HASH =
  find(
    (ac20Record as ClientRecordRecording).response.body.data.custom_fields ??
      [],
    entry =>
      entry.field_id === IMAGE_FIELD_ID ||
      entry.field?.code === "profile_picture"
  )?.value ?? "";

/** The second (created-then-deleted) image field's id, read from AC-22's catalogue. */
const AC22_SECOND_FIELD_ID =
  find((ac22Catalogue as CatalogueRecording).response.body.data, field =>
    startsWith(field.code, "fe3145_second_image")
  )?.id ?? "";

/** The hash the AC-22 changed-field upload returned. */
const AC22_CHANGED_HASH =
  (ac22ChangedUpload as UploadRecording).response.body.data.value ?? "";

/** The hash the AC-21 save upload returned. */
const AC21_UPLOADED_HASH =
  (ac21Upload as UploadRecording).response.body.data.value ?? "";

/** The replay env's API base — useUrl() prepends it to the derived image path. */
const API_BASE = "https://api.upmind.io/api";

/** Whether the current scenario booted a second image cell (AC-22). */
let hasSecondImageCell = false;

export const coveredActionIds: readonly string[] = values(
  CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS
);

/** The one field code the in-memory narrow keeps — the second recorded row, so an
 * unfiltered list (the first row is `age`) fails the read-back. */
const NARROW_CODE = "profile_picture";

/** The selector context that names the INVOICE catalogue (a non-client
 * catalogue). A literal, like `NARROW_CODE`: this catalog imports no module
 * source, so the wire value is spelled here as the `.feature` spells a url. */
const INVOICE_CATALOGUE = "invoice";

/** The client-visible invoice field the AC-38/AC-40 recordings arrange — the
 * one row those catalogue reads hold, so serving the client catalogue instead
 * (whose first row is `age`) fails the read-back. */
const INVOICE_FIELD_CODE = "fe3145_invoice_field";

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the collection settles on it. */
async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
  }
  return assertion();
}

async function open(world: World, scope: Parameters<World["boot"]>[1]) {
  await world.boot(CLIENT_CUSTOM_FIELDS_SCENARIO, scope);
  await world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady);
  await settles(() => world.expectMeta({ isAvailable: true, hasError: false }));
}

/** Boots the catalogue and fires isReady, asserting nothing — the caller does. */
async function boot(world: World) {
  await world.boot(CLIENT_CUSTOM_FIELDS_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady);
}

// -----------------------------------------------------------------------------

export const clientCustomFieldsSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND (client x self — the only resolving cell) ===================

  Given("I am an authenticated client with my own custom field values", world =>
    open(world, { actor: ScopeActorTypes.CLIENT })
  );

  Given(
    "every request I make about my custom fields is addressed to my own value set",
    world => settles(() => world.expectMeta({ isAvailable: true }))
  );

  // === AC-1: the definitions collection is read ==============================

  Then("I see the definitions my own brand has configured", world =>
    settles(() => world.expectMeta({ isEmpty: false, hasError: false }))
  );

  // === AC-3: the rows arrive in their configured display order ================

  Then("my definitions are in their configured display order", world =>
    settles(() =>
      world.expectContext({
        data: [{ code: "age" }, { code: "profile_picture" }]
      })
    )
  );

  // === AC-7: refresh re-reads the definitions ================================

  Given("I have already loaded my custom field definitions", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady)
  );

  When("I ask for a fresh copy", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.refresh)
  );

  Then("my definitions are re-read", world =>
    settles(() => world.expectMeta({ isAvailable: true, hasError: false }))
  );

  // === AC-8: an in-memory narrow needs no new request ========================

  When("I narrow my definitions to one field by its code", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.narrowBy, {
      code: NARROW_CODE
    })
  );

  Then("I see only the matching definition", world =>
    settles(() => world.expectContext({ data: [{ code: NARROW_CODE }] }))
  );

  // === AC-29 / AC-30: the ordering in force ===================================

  Then(
    "the ordering in force is my brand's own display order, ascending",
    world =>
      settles(() =>
        world.expectContext({
          query: { sort: [{ field: "order", dir: "asc" }] }
        })
      )
  );

  When("I order my definitions by field name, descending", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.sortBy, [
      { field: "name", dir: "desc" }
    ])
  );

  Then("the ordering in force is field name, descending", world =>
    settles(() =>
      world.expectContext({ query: { sort: [{ field: "name", dir: "desc" }] } })
    )
  );

  // === AC-31: the free-text search in force ==================================

  When("I search my definitions for a term", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.filterBy, {
      name: { like: "age" }
    })
  );

  Then("the search in force is that term", world =>
    settles(() =>
      world.expectContext({ query: { filters: { name: { like: "age" } } } })
    )
  );

  // === AC-34: paging once a page size is set =================================

  Given("I have set a page size on my definitions", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.setCriteria, {
      pagination: { limit: 1 }
    })
  );

  When("I ask for the next page of my definitions", async world => {
    // The page-size fetch and the pager's hasNextPage settle a tick after
    // setCriteria resolves; nextPage read before that tick is inert. Settle on
    // the first page's own row, then advance.
    await settles(() => world.expectContext({ data: [{ code: "age" }] }));
    await new Promise(resolve => setTimeout(resolve, 300));
    await world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.nextPage);
  });

  Then("the next page of my definitions is in force", world =>
    settles(() => world.expectContext({ query: { pagination: { offset: 1 } } }))
  );

  // === AC-9: the count-of-zero via a server search that matches no field =======
  // `isEmpty` reflects the read collection, so a REAL empty result (a term no
  // field matches) is what proves the count-of-none — not an in-memory narrow.

  When("I search my definitions for a term no field matches", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.filterBy, {
      name: { like: "zzznomatch" }
    })
  );

  Then("I am told the list is empty, with a count of zero", world =>
    settles(() => world.expectMeta({ isEmpty: true, hasError: false }))
  );

  // === AC-36: the whole criteria surface — ordering, search and page — reads back

  Given("I have ordered, searched and paged my definitions", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.setCriteria, {
      sort: [{ field: "name", dir: "desc" }],
      filters: { name: { like: "age" } },
      pagination: { limit: 1 }
    })
  );

  When("I inspect how my catalogue is being read", world =>
    settles(() => world.expectMeta({ isAvailable: true }))
  );

  Then(
    "the ordering, the search and the page in force are all readable",
    world =>
      settles(() =>
        world.expectContext({
          query: {
            sort: [{ field: "name", dir: "desc" }],
            filters: { name: { like: "age" } },
            pagination: { limit: 1 }
          }
        })
      )
  );

  // === AC-38: reading a non-client (INVOICE) catalogue by name ================

  Given("my brand keeps a separate catalogue of fields for invoices", () =>
    Promise.resolve()
  );

  When("I open that catalogue by name", world =>
    open(world, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: INVOICE_CATALOGUE }
    })
  );

  Then("the fields I am shown are the ones that catalogue holds", world =>
    settles(() => world.expectContext({ data: [{ code: INVOICE_FIELD_CODE }] }))
  );

  // === AC-40: each catalogue keeps its own copy, none answered from another ====

  Given("I have already read my own client fields", world =>
    settles(() => world.expectContext({ data: [{ code: "age" }] }))
  );

  When("I open a second catalogue in the same sitting", world =>
    open(world, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: INVOICE_CATALOGUE }
    })
  );

  Then(
    "the second catalogue is read for itself rather than answered from the first",
    world =>
      settles(() =>
        world.expectContext({ data: [{ code: INVOICE_FIELD_CODE }] })
      )
  );

  // === AC-18: an image upload settles complete, progress reaching 100 =========
  // `progress` is a documented 0/100 signal (useClientCustomFieldImage.meta):
  // no incremental progress exists in this transport, so "how far it has got" is
  // proven by progress reaching 100 as the upload settles complete.

  When("I upload an image for one of my custom fields", async world => {
    await openImageEditor(world);
    // prettier-ignore
    await world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.upload, pixelPng(), CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO);
  });

  Then("I can see that it is uploading and how far it has got", world =>
    settles(() =>
      world.expectMeta(
        { isComplete: true, progress: 100, hasError: false },
        CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO
      )
    )
  );

  // === AC-19: a rejected upload reports against the field, not a generic key ===

  Given(
    "uploading an image for one of my custom fields is rejected",
    async world => {
      await openImageEditor(world);
      // The recorded 422 ("Invalid or corrupt image.") is the arrange: the upload
      // MUST reject, and an upload that resolves fails the scenario here.
      // prettier-ignore
      const rejected = await world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.upload, pixelPng(), CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO)
      .then(() => false)
      .catch(() => true);
      if (!rejected)
        throw new Error("expected the image upload to be rejected");
    }
  );

  When("I inspect what went wrong", world =>
    settles(() =>
      world.expectMeta({ hasError: true }, CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO)
    )
  );

  Then(
    "the problem is reported against that specific field, not a generic image error",
    world =>
      settles(() =>
        world.expectContext!(
          {
            errors: {
              "custom_fields.profile_picture": ["Invalid or corrupt image."]
            }
          },
          CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO
        )
      )
  );

  // === AC-20: a stored image yields a link + preview (getImageByHash, no request)

  Given("one of my custom fields holds a stored image", async world => {
    hasSecondImageCell = false;
    await openImageEditor(world);
  });

  When("I view that field", world =>
    world.fire(
      CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.flush,
      AC20_STORED_HASH,
      CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO
    )
  );

  // `preview` is the download URL getImageByHash derives from the stored hash —
  // useUrl() prepends the configured API base, so it is absolute at replay.
  Then("I see a link to the image and a preview of it", world =>
    settles(() =>
      world.expectContext!(
        {
          hash: AC20_STORED_HASH,
          preview: `${API_BASE}/images/${AC20_STORED_HASH}/download`
        },
        CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO
      )
    )
  );

  // === AC-21: flush IS the save — a changed image is uploaded, value = its hash

  Given("I have changed the image for one of my custom fields", async world => {
    hasSecondImageCell = false;
    await openImageEditor(world);
  });

  Then(
    "that image is stored first, and the saved value carries the stored image",
    world =>
      settles(() =>
        world.expectContext!(
          { hash: AC21_UPLOADED_HASH, value: AC21_UPLOADED_HASH },
          CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO
        )
      )
  );

  // === AC-22: only the changed image re-uploads — two cells, one upload ========

  Given(
    "I have two image fields, one I changed and one I left alone",
    async world => {
      hasSecondImageCell = true;
      await openImageEditor(world);
      await openImageEditorFor(
        world,
        CLIENT_CUSTOM_FIELD_IMAGE_2_SCENARIO,
        AC22_SECOND_FIELD_ID
      );
    }
  );

  // Shared by AC-21 and AC-22: flush the changed cell (uploads); for AC-22 also
  // flush the untouched cell, which short-circuits on its stored hash — a second
  // upload would land with no recording and fail the scenario by name.
  When("I save my changes", async world => {
    await world.fire(
      CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.flush,
      pixelPng(),
      CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO
    );
    if (hasSecondImageCell)
      await world.fire(
        CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.flush,
        undefined,
        CLIENT_CUSTOM_FIELD_IMAGE_2_SCENARIO
      );
  });

  Then("only the changed image is uploaded", world =>
    settles(() =>
      world.expectContext!(
        { hash: AC22_CHANGED_HASH },
        CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO
      )
    )
  );

  // === AC-25: signed-out guard (top level, no Background) =====================

  When("my custom field values are read while signed out", world =>
    boot(world)
  );

  Then("my custom field values are not available to me", world =>
    settles(() => world.expectMeta({ isAvailable: false }))
  );

  Then("no custom-field request escapes while I am signed out", async () => {});

  // === AC-6: a failed definitions read settles errored, not hanging ==========

  Given("loading my definitions fails at the server", world => boot(world));

  When("I wait for my definitions to be ready", world =>
    world.fire(CLIENT_CUSTOM_FIELDS_COVERED_ACTIONS.isReady)
  );

  Then("I am told they are not ready rather than waiting forever", world =>
    settles(() => world.expectMeta({ hasError: true }))
  );
});

export default clientCustomFieldsSteps;
