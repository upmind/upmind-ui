// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields IMAGE value flow — upload, error, flush (integration)
 *
 * ## Job To Be Done
 * Drive the REAL `useClientCustomFieldImage().as('self').for('field', id)`
 * and `useClientCustomFields().useActions().flushImages()` against the REAL
 * recorded `POST clients/fields/{field_id}/image` responses (a genuine 200
 * with a hash, and a genuine 422 with `error.data.image`) and prove:
 * AC-18 upload progress is honestly reported — binary 0/100 (the dispatch's
 *       own known partial-delivery limit: real incremental progress needs
 *       XHR/streams in `system-upload`, out of scope here — asserted as such,
 *       never smoothed over);
 * AC-19 a rejected upload's AJV `image` entry
 *       (`mapToHeadlessError(error).origin.data`, `propertyName === "image"`
 *       / `instancePath === "/image"`) is rewritten onto `custom_fields.<code>`,
 *       never left as the bare `image` key — the legacy axios
 *       `error.data.image` shape this AC's read-back once assumed never
 *       occurs here;
 * AC-20 a stored image exposes a download URL + preview, both emptied by
 *       clearing;
 * AC-21 `flushImages()` only resolves once the dirty image's upload has
 *       settled, and the resolved model carries the REAL uploaded hash — the
 *       structural half of "flush before the PUT" that lives in this module
 *       (the PUT-ordering half is `client-personal-details`'s own AC-21 test,
 *       T-B9);
 * AC-22 with one dirty image and one untouched, exactly one POST is issued.
 *
 * ## What Breaks If These Fail
 * AC-19 failing means a consumer's form cannot attribute an upload failure to
 * the right field. AC-21 failing means a save could persist a raw File
 * reference instead of the hash the API actually stored.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
// Import order is load-bearing — see the same note in
// `client-custom-fields.collection.int.test.ts`.
import {
  observeRequests,
  recorded,
  recordedDefinitions,
  recordedIds,
  seedClientSession
} from "./client-custom-fields.int-helpers";
import { server } from "./setup.integration";
// eslint-disable-next-line import/order
import {
  ClientCustomFieldContextTypes,
  useClientCustomFieldImage,
  useClientCustomFields
} from "..";
// eslint-disable-next-line import/order
import { ScopeActorTypes } from "../../scope/scope.types";

// -----------------------------------------------------------------------------

function fakeFile(name: string, contents = "binary"): File {
  return new File([contents], name, { type: "image/png" });
}

// -----------------------------------------------------------------------------

describe("client-custom-fields image editor — AC-18 progress, AC-20 download/preview", () => {
  it("AC-18 reports uploading + progress honestly (binary 0/100), settling both back afterwards", async () => {
    await seedClientSession();
    const { imageFieldId } = recordedIds();

    const image = useClientCustomFieldImage()
      .as(ScopeActorTypes.SELF)
      .for(ClientCustomFieldContextTypes.FIELD, imageFieldId);
    const meta = image.useMeta();

    expect(meta.isUploading.value).toBe(false);
    expect(meta.progress.value).toBe(0);

    const settling = image.useActions().upload(fakeFile("avatar.png"));
    await vi.waitFor(() => expect(meta.isUploading.value).toBe(true));

    await settling;

    expect(meta.isUploading.value).toBe(false);
    expect(meta.progress.value).toBe(100);
  });

  it("AC-20 a stored image exposes a real download URL and preview, both emptied by clearing", async () => {
    await seedClientSession();
    const { imageFieldId } = recordedIds();
    const uploaded = recorded.imageUpload().data;

    const image = useClientCustomFieldImage()
      .as(ScopeActorTypes.SELF)
      .for(ClientCustomFieldContextTypes.FIELD, imageFieldId);

    await image.useActions().flush(uploaded.value);

    await vi.waitFor(() =>
      expect(image.useContext().downloadUrl.value).toBeTruthy()
    );
    expect(image.useContext().preview.value).toBeTruthy();

    image.useActions().remove();

    await vi.waitFor(() =>
      expect(image.useContext().downloadUrl.value).toBeFalsy()
    );
    expect(image.useContext().preview.value).toBeFalsy();
  });
});

describe("client-custom-fields image editor — AC-19 the error-key rewrite", () => {
  it("AC-19 rewrites a rejected upload's error onto custom_fields.<code>, not the bare `image` key", async () => {
    await seedClientSession();
    const { imageFieldId } = recordedIds();
    const imageField = recordedDefinitions().find(
      field => field.id === imageFieldId
    );
    if (!imageField) throw new Error("Recorded IMAGE definition missing.");
    const rejection = recorded.imageUploadRejected();

    // The RAW recorded response holds staging's own axios-shaped body
    // (`error.data.image: string[]`) — the AJV reshape
    // (`mapToHeadlessError(error).origin.data`, entries with
    // `propertyName === "image"` / `instancePath === "/image"`) is the
    // app's OWN internal pipeline, applied AFTER this response is received,
    // never the shape staging returns. The message text is what survives
    // that reshape unchanged, so it is what this spec checks for.
    const rejectedMessage = (
      rejection.response.body as { error: { data: { image: string[] } } }
    ).error.data.image[0];

    // The replay server's fixture identity for the rejected capture carries
    // this generator's OWN `?case=rejected` disambiguator (needed at capture
    // time to keep two real responses for one route from overwriting each
    // other — see `client-custom-fields.fixtures.ts`). A normal upload call
    // never sends that param, so an explicit override — serving the SAME
    // real recorded status/body — is what actually exercises the rejection
    // here; without it the generic replay match falls through to the
    // success fixture for the same route.
    server?.use(
      http.post("*/clients/fields/*/image", () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );

    const image = useClientCustomFieldImage()
      .as(ScopeActorTypes.SELF)
      .for(ClientCustomFieldContextTypes.FIELD, imageFieldId);

    await expect(
      image.useActions().upload(fakeFile("not-an-image.txt"))
    ).rejects.toBeTruthy();

    await vi.waitFor(() => expect(image.useMeta().hasError.value).toBe(true));

    const errors = image.useContext().errors.value as Record<string, unknown>;
    // AC-19's own contract names the CODE (`custom_fields.<code>`), not the
    // field id — asserted on the exact key, not a loose prefix match.
    const rewrittenKey = `custom_fields.${imageField.code}`;
    expect(errors).toHaveProperty(rewrittenKey);
    expect(errors).not.toHaveProperty("image");
    expect(JSON.stringify(errors[rewrittenKey])).toContain(rejectedMessage);
  });
});

describe("client-custom-fields collection — AC-21/AC-22 flushImages()", () => {
  it("AC-21 flushImages() resolves only after the dirty image's upload settles, with the REAL hash in the model", async () => {
    await seedClientSession();
    const { ageFieldId } = recordedIds();
    void ageFieldId;
    const uploaded = recorded.imageUpload().data;
    const observed = observeRequests("/image");

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);

    const model = await fields.useActions().flushImages({
      profile_picture: fakeFile("avatar.png")
    });
    observed.stop();

    expect(observed.count()).toBe(1);
    expect(model.profile_picture).toBe(uploaded.value);
  });

  it("AC-22 with one dirty image and one untouched, exactly one POST is issued", async () => {
    await seedClientSession();
    const observed = observeRequests("/image");

    const fields = useClientCustomFields().as(ScopeActorTypes.SELF);

    const model = await fields.useActions().flushImages({
      profile_picture: fakeFile("avatar.png"),
      untouched_image: "already-a-stored-hash"
    });
    observed.stop();

    expect(observed.count()).toBe(1);
    expect(model.untouched_image).toBe("already-a-stored-hash");
  });
});
