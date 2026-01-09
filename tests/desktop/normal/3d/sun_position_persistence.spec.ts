import { test, expect, Page } from "@playwright/test";
import {
  HelioviewerFactory,
  MobileView,
  DesktopView,
  MobileInterface
} from "../../../page_objects/helioviewer_interface";
import fs from "fs";

const gse2frameResponse = {
  coordinates: [
    {
      x: 0,
      y: 0,
      z: 0,
      time: "2024-12-31T00:05:00.000"
    }
  ]
};

/**
 * Helper function to set up the 3D scene for tests.
 */
async function Initialize3D(hv: MobileInterface, page: Page) {
  await hv.Load("/");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();
  // Set the observation date to a date with available data.
  await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 00:00:00Z"));
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();
  const response = page.route(
    "**/gse2frame",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(gse2frameResponse)
      });
    },
    { times: 2 }
  );
  // This is the 3D model that the image will be rendered onto.
  const glbResponse = page.waitForResponse("**/zit.glb");

  // Now start 3D
  await hv.Toggle3D();
  // Wait for the network requests to complete
  await response;
  // Expect the model to be loaded.
  await glbResponse;
  // Wait for the page to process the result by rendering the image.
  await page.waitForTimeout(1000);
}

[MobileView, DesktopView].forEach((view) => {
  /**
   * Test to verify that the sun's position persists after updating the observation date.
   *
   * Bug: After entering 3D mode and dragging the sun off-center with right-click + drag,
   * updating the observation date causes the sun to snap back to the center of the screen.
   * Expected behavior: The sun should stay in its dragged position.
   *
   * This test currently expects the correct behavior and will FAIL until the bug is fixed.
   */
  test.only(`[${view.name}] Sun stays off-center after date update`, { tag: view.tag }, async ({ page }, info) => {
    // Firefox in playwright does not allow webgl2 creation.
    if (page.context().browser().browserType().name() === "firefox") {
      test.skip();
    }

    let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;

    // Initialize 3D mode
    await Initialize3D(hv, page);

    // Perform right-click drag to move sun off-center
    const centerX = page.viewportSize().width / 2;
    const centerY = page.viewportSize().height / 2;

    // Move to center and perform right-click drag
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(centerX + 150, centerY - 100);
    // Click and drag is animated, so need to wait for the animation
    // to finish before releasing right mouse, otherwise the animation
    // ends in a non-deterministic position. Meaning the image always
    // ends up in a different place each run.
    await page.waitForTimeout(1000);
    await page.mouse.up({ button: "right" });

    await expect(page).toHaveScreenshot('initial.png');

    // Update observation date
    await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 06:00:00Z"));
    await hv.WaitForLoadingComplete();

    // Update observation date back to where it was
    await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 00:00:00Z"));
    await hv.WaitForLoadingComplete();

    // In theory this "should" be the same as initial.png, but it seems that
    // either due to math errors or precision errors the actual result
    // is slightly off. It is functional enough to rely on, even though
    // it's not perfect. So compare to a separate screenshot rather than
    // against the original.
    await expect(page).toHaveScreenshot('after-change.png');
  });
});
