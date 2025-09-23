import { test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

// If there is no image to make movie , then hv should show some friendly notification message
test("If there is not enough data, helioviewer should show warning message about no data situation", async ({
  page
}) => {
  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : SUBMIT FULLSCREEN MOVIE
  await hv.movie.makeFullScreenmovie();

  await hv.assertNotification("warn", "No images found for requested time range. Please try a different time.");
});
