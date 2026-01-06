import { test, expect } from "@playwright/test";
import {
  MobileView,
  DesktopView,
  HelioviewerFactory,
  MobileInterface
} from "../../../page_objects/helioviewer_interface";

// Bug: Error message incorrectly appears after refreshing page with 3D mode enabled
// This behavior was observed during manual testing:
// 1. Enable 3D mode in browser where WebGL is supported
// 2. Refresh page
// 3. Error message saying WebGL is not supported appears, but it shouldn't
[MobileView, DesktopView].forEach((view) => {
  test(
    `[${view.name}] Verify no WebGL error after refresh with 3D enabled`,
    { tag: [view.tag] },
    async ({ page, browserName }, info) => {
      // Skip Firefox - it doesn't support 3D mode
      test.skip(browserName === "firefox", "Firefox does not support 3D mode");

      let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;

      // Load Helioviewer
      await hv.Load("/");
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // Set observation date to ensure data is available
      await hv.SetObservationDateTimeFromDate(new Date("2024-12-31 00:00:00"));
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // Enable 3D mode
      await hv.Toggle3D();
      await hv.WaitForLoadingComplete();
      await hv.CloseAllNotifications();

      // Verify 3D mode is active
      expect(await page.locator(".js-3d-toggle.active").count()).toBeGreaterThan(0);

      // Refresh the page
      await page.reload();
      await hv.WaitForLoadingComplete();

      // Verify no WebGL error message appears
      await expect(
        page
          .locator("div.jGrowl-notification.error > div.jGrowl-message")
          .getByText(/Your browser does not support WebGL/i)
      ).not.toBeVisible();

      // Verify 3D mode is still active after refresh
      expect(await page.locator(".js-3d-toggle.active").count()).toBeGreaterThan(0);
    }
  );
});
