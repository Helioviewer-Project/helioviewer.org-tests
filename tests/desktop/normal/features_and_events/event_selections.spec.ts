import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import { readJSON, getLocalStorage } from "../../../utils/utils";
import { mockEvents } from "../../../utils/events";

/**
 * Event selections smoke — load Helioviewer from a predefined state stored as
 * JSON under ./local_states/ and capture the rendered result for inspection.
 *
 * State files in ./local_states/ ARE the localStorage map directly: top-level
 * keys are localStorage keys, values are whatever the app expects under that key.
 */
test("Event selections should be inside new fresh loads", async ({ page }, info) => {
  const hv = new Helioviewer(page, info);

  // No localStorage seeding — normal fresh load.
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.WaitForLoadingComplete();

  // event_selections should exist under settings.state, and be an empty array.
  const eventSelections = await getLocalStorage(page, "settings.state.event_selections");
  expect(eventSelections).toEqual([]);
});

test("Event selections should build from current selections in local storage", async ({ page }, info) => {
  const localStorage = readJSON(`${__dirname}/local_states/events_with_selected_events_types.json`);

  const hv = new Helioviewer(page, info);

  // Seed localStorage with the scenario's predefined state, then load.
  await hv.Load("/", localStorage);
  await hv.CloseAllNotifications();
  await hv.WaitForLoadingComplete();

  // Assert settings.state.event_selections resolves to the expected list.
  const eventSelections = await getLocalStorage(page, "settings.state.event_selections");
  expect(eventSelections).toEqual(["HEK>>CME", "HEK>>Sunspot", "CCMC>>DONKI"]);
});

test("Event selections should be sync with normal flow of selections", async ({ page }, info) => {
  // Sample event tree — two eventtypes under HEK, each with one frm and one instance.
  const events = {
    HEK: {
      "Active Region": {
        SPoCA: {
          "AR SPoCA 1": {}
        }
      },
      Sunspot: {
        SPoCA: {
          "SS SPoCA 1": {}
        }
      },
      Eruption: {
        SPoCA: {
          "ER SPoCA 1": {}
        }
      },
      "Coronal Hole": {
        SPoCA: {
          "CH SPoCA 2": {}
        }
      }
    }
  };
  await mockEvents(page, events);

  const hv = new Helioviewer(page, info);
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.WaitForLoadingComplete();
  await hv.OpenEventsDrawer();

  const hekTree = hv.parseTree("HEK");

  // Select two event types — event_selections should reflect both.
  await hekTree.toggleCheckEventType("Active Region");
  await hekTree.toggleCheckEventType("Coronal Hole");

  let selections = await getLocalStorage(page, "settings.state.event_selections");
  expect(selections).toEqual(expect.arrayContaining(["HEK>>Active Region", "HEK>>Coronal Hole"]));
  expect(selections).toHaveLength(2);

  // Unselect one — the remaining selection should still be reflected.
  await hekTree.toggleCheckEventType("Coronal Hole");

  selections = await getLocalStorage(page, "settings.state.event_selections");
  expect(selections).toEqual(["HEK>>Active Region"]);
});
