import { test, expect } from "@playwright/test";
import { MobileView, DesktopView, HelioviewerFactory, MobileInterface } from "../../../page_objects/helioviewer_interface";

[MobileView, DesktopView].forEach((view) => {
  test.describe(() => {
    // Only apply WebGL disable flags for chromium-based browsers
    test.beforeEach(async ({ browserName }) => {
      test.skip(
        browserName === "firefox" || browserName === "webkit",
        "WebGL disable flags only work on Chromium-based browsers"
      );
    });

    // Disable WebGL for Chromium/Edge only
    test.use({
      launchOptions: {
        args: ['--disable-webgl', '--disable-webgl2']
      }
    });

    test(
      `[${view.name}] Verify error message when WebGL is disabled`,
      { tag: [view.tag] },
      async ({ page }, info) => {

      let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;

      // Load Helioviewer
      await hv.Load("/");
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // Set observation date to ensure data is available
      await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 00:00:00"));
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // Attempt to enable 3D mode
      await hv.Toggle3D();

      // Verify error message is displayed
      await expect(
        page.locator("div.jGrowl-notification.error > div.jGrowl-message")
          .getByText(/Your browser does not support WebGL/i)
      ).toBeVisible();

      // Verify 3D mode did not activate
      expect(await page.locator(".js-3d-toggle.active").count()).toBe(0);
      }
    );
  });
});
