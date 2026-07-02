import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import { getLocalStorage, readJSON } from "../../../utils/utils";

test("Event visibility selections should be inside new fresh loads", async ({ page }, info) => {
  const hv = new Helioviewer(page, info);

  // No localStorage seeding — normal fresh load.
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.WaitForLoadingComplete();

  // event_visibility_selections should be an object keyed by source, each source
  // exposing label_visibility + marker_visibility. Assert HEK has that shape.
  const eventVisibilitySelections = await getLocalStorage(page, "settings.state.event_visibility_selections");
  expect(eventVisibilitySelections).toMatchObject({
    HEK: { label_visibility: true, marker_visibility: true }
  });
});

test("Event visibility selections should be loaded from visibility selections of current state", async ({
  page
}, info) => {
  const localStorage = readJSON(`${__dirname}/local_states/events_with_selected_event_visibilities.json`);

  const hv = new Helioviewer(page, info);

  // Seed localStorage where tree_HEK.markers_visible=false and tree_CCMC.labels_visible=false.
  await hv.Load("/", localStorage);
  await hv.CloseAllNotifications();
  await hv.WaitForLoadingComplete();

  // event_visibility_selections should mirror the seeded events_v2 flags:
  // HEK markers off + labels on, CCMC markers on + labels off.
  const eventVisibilitySelections = await getLocalStorage(page, "settings.state.event_visibility_selections");
  expect(eventVisibilitySelections).toMatchObject({
    HEK: { label_visibility: true, marker_visibility: false },
    CCMC: { label_visibility: false, marker_visibility: true }
  });
});

test("Event visibility selections should be sync with normal flow of visibility changes", async ({ page }, info) => {
  const localStorage = readJSON(`${__dirname}/local_states/events_with_selected_event_visibilities.json`);

  const hv = new Helioviewer(page, info);

  // Seed: HEK label=true+marker=false, CCMC label=false+marker=true.
  await hv.Load("/", localStorage);
  await hv.CloseAllNotifications();
  await hv.WaitForLoadingComplete();
  await hv.OpenEventsDrawer();

  // Turn off HEK labels (label=true -> false).
  const hekTree = hv.parseTree("HEK");
  await hekTree.toggleVisibilityEventLabels();

  // Turn off CCMC markers (marker=true -> false).
  const ccmcTree = hv.parseTree("CCMC");
  await ccmcTree.toggleVisibilityEvents();

  // Both sources should now be all-false.
  const eventVisibilitySelections = await getLocalStorage(page, "settings.state.event_visibility_selections");
  expect(eventVisibilitySelections).toMatchObject({
    HEK: { label_visibility: false, marker_visibility: false },
    CCMC: { label_visibility: false, marker_visibility: false }
  });
});
