import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import { readJSON, getLocalStorage } from "../../../utils/utils";

/**
 * Event selections smoke — load Helioviewer from a predefined state stored as
 * JSON under ./local_states/ and capture the rendered result for inspection.
 *
 * State files in ./local_states/ ARE the localStorage map directly: top-level
 * keys are localStorage keys, values are whatever the app expects under that key.
 */
test("Event selections should build from current selections in local storage", async ({ page }, info) => {
  const localStorage = readJSON(`${__dirname}/local_states/events_with_selected_events_types.json`);

  const hv = new Helioviewer(page, info);

  // Seed localStorage with the scenario's predefined state, then load.
  await hv.Load("/", localStorage);
  await hv.CloseAllNotifications();
  await hv.WaitForLoadingComplete();

  // Dump the page's localStorage (after the app has booted and possibly
  // mutated it) and attach as JSON to the Playwright report. Each value is
  // JSON.parse'd when possible so nested settings render readably; raw
  // strings fall through unchanged.
  const localStorageDump = await page.evaluate(() => {
    const dump: Record<string, unknown> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)!;
      const raw = window.localStorage.getItem(key)!;
      try {
        dump[key] = JSON.parse(raw);
      } catch {
        dump[key] = raw;
      }
    }
    return dump;
  });
  await info.attach("localStorage.json", {
    body: JSON.stringify(localStorageDump, null, 2),
    contentType: "application/json"
  });

  // Assert settings.state.event_selections resolves to the expected list.
  const eventSelections = await getLocalStorage(page, "settings.state.event_selections");
  expect(eventSelections).toEqual(["HEK>>CME", "HEK>>Sunspot", "CCMC>>DONKI"]);

  // Capture the post-load state for inspection. saveScreenshotAndExit
  // intentionally fails the test so the attached screenshot is the artifact.
  await hv.saveScreenshotAndExit();
});
