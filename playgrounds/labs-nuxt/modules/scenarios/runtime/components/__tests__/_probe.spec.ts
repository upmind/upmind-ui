import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { recordedBodies } from "@upmind-automation/headless/testing";
import clientEmails from "../../../useClientEmails/client-email.scenario";
import receivedEmails from "../../../useClientReceivedEmails/client-email-history.scenario";
import { defaultRow, unverifiedRow } from "../../../testing/recorded-emails";
import { RESOLVED_HANDOFFS } from "./resolved-handoffs";
import { ListSurface, DetailSurface } from "../surfaces/index";
import { DetailDialog, ContextPanel } from "../index";
import ManageDialog from "../ManageDialog.vue";
import { keys } from "lodash-es";

window.matchMedia =
  window.matchMedia ||
  ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as unknown as MediaQueryList);

async function loadHist() {
  const hist = recordedBodies["client-email-history"];
  const single: any = await hist["get-emails-id"]();
  const list: any = await hist["get-self-email-history-case-default"]();
  return {
    singleWire: single.response.body.data,
    listWire: list.response.body.data
  };
}

const toReceivedRow = (w: any) => ({
  id: w.id,
  subject: w.subject,
  from: w.from,
  recipient: { email: w.recipient },
  dateSent: { date: w.sent_at, relative: w.sent_at },
  meta: { isSent: w.sent, isBounced: w.bounced },
  body: w.data?.body ?? ""
});

describe("probe2", () => {
  it("client-email view control + DetailDialog props + edit handoff", async () => {
    const rows = [defaultRow, unverifiedRow];
    const w = mount(ListSurface, {
      attachTo: document.body,
      props: {
        snapshot: {
          actions: [],
          context: { data: rows },
          meta: { isEmpty: false, isFiltered: false }
        },
        actions: {
          ensure: () => {},
          remove: () => {},
          setDefault: () => {},
          verify: () => {}
        },
        presentation: clientEmails.presentation,
        handoffs: RESOLVED_HANDOFFS
      }
    });
    const li = w.findAll("li")[0];
    console.log(
      "CE row0 control test-values:",
      li.findAll("[data-test-value]").map(n => n.attributes("data-test-value"))
    );
    // try clicking the view control
    const viewBtn = li
      .findAll("[data-test-value]")
      .find(n => /view/.test(n.attributes("data-test-value") || ""));
    console.log(
      "CE view btn test-value:",
      viewBtn?.attributes("data-test-value")
    );
    if (viewBtn) {
      await viewBtn.trigger("click");
      await flushPromises();
    }
    const dd = w.findAllComponents(DetailDialog);
    console.log("CE DetailDialog count:", dd.length);
    if (dd.length) {
      console.log("CE DetailDialog props keys:", keys(dd[0].props()));
      console.log("CE DetailDialog.detail:", dd[0].props("detail"));
      console.log("CE DetailDialog.context:", dd[0].props("context"));
      console.log(
        "CE DetailDialog.record.id:",
        (dd[0].props("record") as any)?.id
      );
      console.log(
        "CE DetailDialog.actions names:",
        (dd[0].props("actions") as any[])?.map(a => a.name ?? a)
      );
      console.log(
        "CE ManageDialog before edit:",
        w.findAllComponents(ManageDialog).length
      );
      const editBtn = dd[0]
        .findAll("[data-test-value]")
        .find(n => n.attributes("data-test-value") === "edit");
      console.log("CE edit-in-detail present:", !!editBtn);
      if (editBtn) {
        await editBtn.trigger("click");
        await flushPromises();
      }
      console.log(
        "CE ManageDialog after edit:",
        w.findAllComponents(ManageDialog).length
      );
    }
    expect(true).toBe(true);
  });

  it("received-emails view + real useDetail boot for(type,id)", async () => {
    const { listWire } = await loadHist();
    const rows = listWire.slice(0, 2).map(toReceivedRow);
    console.log("REC row0:", JSON.stringify(rows[0]).slice(0, 200));

    const steps: any[] = [];
    const wrapped: any = (...a: never[]) => {
      const built = (receivedEmails.useDetail as any)(...a);
      return {
        as(actor: ScopeActorTypes) {
          const cell = built.as(actor);
          return {
            ...cell,
            for: (type: string, id: string) => {
              steps.push({ type, id });
              return cell.for?.(type, id) ?? cell;
            }
          };
        }
      };
    };
    const detail = {
      useDetail: wrapped,
      actor: ScopeActorTypes.CLIENT,
      identifier: "id"
    };

    const w = mount(ListSurface, {
      attachTo: document.body,
      props: {
        snapshot: {
          actions: [],
          context: { data: rows },
          meta: { isEmpty: false, isFiltered: false }
        },
        actions: {},
        presentation: receivedEmails.presentation,
        detail
      }
    });
    const li = w.findAll("li")[0];
    console.log(
      "REC row0 control test-values:",
      li.findAll("[data-test-value]").map(n => n.attributes("data-test-value"))
    );
    const viewBtn = li
      .findAll("[data-test-value]")
      .find(n => /view/.test(n.attributes("data-test-value") || ""));
    console.log("REC view btn:", viewBtn?.attributes("data-test-value"));
    if (viewBtn) {
      await viewBtn.trigger("click");
      await flushPromises();
    }
    const dd = w.findAllComponents(DetailDialog);
    console.log("REC DetailDialog count:", dd.length);
    if (dd.length) {
      console.log("REC DetailDialog.detail present:", !!dd[0].props("detail"));
      console.log("REC DetailDialog.context:", dd[0].props("context"));
      console.log(
        "REC DetailDialog.record.id:",
        (dd[0].props("record") as any)?.id
      );
    }
    console.log("REC builder steps:", JSON.stringify(steps));
    expect(true).toBe(true);
  });
});
