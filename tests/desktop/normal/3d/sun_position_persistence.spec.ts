import { test, expect, Page } from "@playwright/test";
import {
  HelioviewerFactory,
  MobileView,
  DesktopView,
  MobileInterface
} from "../../../page_objects/helioviewer_interface";

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
  await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 00:00:00"));
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
  test(`[${view.name}] Sun stays off-center after date update`, { tag: view.tag }, async ({ page }, info) => {
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
    await page.mouse.move(centerX + 150, centerY - 100); // Drag right and up
    await page.mouse.up({ button: "right" });

    // Wait for render to stabilize
    await page.waitForTimeout(500);

    // Take screenshot of dragged position
    await expect(page).toHaveScreenshot("sun-dragged-initial.png");

    // Update observation date
    await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 06:00:00"));
    await hv.WaitForLoadingComplete();

    // Wait for 3D scene to re-render
    await page.waitForTimeout(1000);

    // Update observation date back to where it was
    await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 00:00:00"));
    await hv.WaitForLoadingComplete();

    // Verify sun stayed in dragged position (screenshot should match)
    await expect(page).toHaveScreenshot("sun-dragged-initial.png");
  });
});
